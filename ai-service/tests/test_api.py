"""API tests for the AI recommender service."""
from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app  # noqa: E402
from recommender import smoothed_mastery, topic_display_name  # noqa: E402

client = TestClient(app)


def _ts(days_ago: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat().replace("+00:00", "Z")


def _answer(topic: str, correct: bool, days_ago: float = 1, subject_id: int = 1, subject_name: str = "Mathematics"):
    return {
        "topic": topic,
        "subjectId": subject_id,
        "subjectName": subject_name,
        "correct": correct,
        "answeredAt": _ts(days_ago),
    }


LESSONS = [
    # Mathematics
    {"lessonId": 3, "title": "Solving One-Step Equations", "topic": "linear-equations", "subjectId": 1,
     "subjectName": "Mathematics", "chapterId": 1, "chapterTitle": "Linear Equations", "order": 1, "completed": True},
    {"lessonId": 4, "title": "Solving Two-Step Equations", "topic": "linear-equations", "subjectId": 1,
     "subjectName": "Mathematics", "chapterId": 1, "chapterTitle": "Linear Equations", "order": 2, "completed": False},
    {"lessonId": 5, "title": "Intro to Fractions", "topic": "fractions", "subjectId": 1,
     "subjectName": "Mathematics", "chapterId": 2, "chapterTitle": "Fractions", "order": 1, "completed": False},
    # Physics (untouched)
    {"lessonId": 10, "title": "What Is Motion?", "topic": "motion", "subjectId": 2,
     "subjectName": "Physics", "chapterId": 5, "chapterTitle": "Motion", "order": 1, "completed": False},
    {"lessonId": 11, "title": "Speed and Velocity", "topic": "motion", "subjectId": 2,
     "subjectName": "Physics", "chapterId": 5, "chapterTitle": "Motion", "order": 2, "completed": False},
]


# ---------------------------------------------------------------------------
# Unit-level checks
# ---------------------------------------------------------------------------
def test_mastery_prior_and_display_name():
    import numpy as np

    assert smoothed_mastery(np.array([]), np.array([])) == pytest.approx(0.5)
    # 2 fresh correct answers: (2 + 1) / (2 + 2) = 0.75
    assert smoothed_mastery(np.array([1, 1]), np.array([0, 0])) == pytest.approx(0.75)
    # a 14-day-old answer counts half
    assert smoothed_mastery(np.array([1]), np.array([14])) == pytest.approx(1.5 / 2.5)
    assert topic_display_name("linear-equations") == "Linear Equations"


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------
def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "ai-recommender", "version": "1.0.0"}


# ---------------------------------------------------------------------------
# /recommend
# ---------------------------------------------------------------------------
def test_recommend_weak_topic_is_revise_first():
    answers = [_answer("linear-equations", c) for c in (True, False, False, True, False)]
    answers += [_answer("fractions", True) for _ in range(4)]
    r = client.post("/recommend", json={"studentId": 12, "answers": answers, "lessons": LESSONS, "limit": 4})
    assert r.status_code == 200, r.text
    body = r.json()

    assert body["studentId"] == 12
    assert body["model"] == "bayesian-mastery-v1"
    assert "generatedAt" in body

    # subject mastery: only Mathematics has answers
    assert [s["subjectId"] for s in body["subjectMastery"]] == [1]
    assert body["subjectMastery"][0]["answered"] == 9
    assert 0 <= body["subjectMastery"][0]["mastery"] <= 1

    # weak topics: linear-equations only (2/5), fractions is strong
    assert len(body["weakTopics"]) == 1
    wt = body["weakTopics"][0]
    assert wt["topic"] == "linear-equations" and wt["answered"] == 5 and wt["correct"] == 2
    assert wt["mastery"] < 0.6

    recs = body["recommendations"]
    assert 1 <= len(recs) <= 4
    first = recs[0]
    assert first["kind"] == "REVISE"
    assert first["lessonId"] == 3  # completed, but still recommended for revision
    assert "Linear Equations" in first["reason"] and "2/5" in first["reason"]

    # sorted by priority desc, no duplicate lessons, valid kinds
    prios = [x["priority"] for x in recs]
    assert prios == sorted(prios, reverse=True)
    assert len({x["lessonId"] for x in recs}) == len(recs)
    kinds = {x["kind"] for x in recs}
    assert kinds <= {"REVISE", "CONTINUE", "START"}
    # Physics is untouched -> START on its first lesson
    assert any(x["kind"] == "START" and x["lessonId"] == 10 for x in recs)
    # Maths continues with the next uncompleted lesson
    assert any(x["kind"] == "CONTINUE" and x["lessonId"] == 4 for x in recs)


def test_recommend_new_student_no_answers():
    lessons = [dict(l, completed=False) for l in LESSONS]
    r = client.post("/recommend", json={"studentId": 99, "answers": [], "lessons": lessons})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["subjectMastery"] == []
    assert body["weakTopics"] == []
    recs = body["recommendations"]
    assert {x["kind"] for x in recs} == {"START"}
    assert [x["lessonId"] for x in recs] == [3, 10]  # first lesson of each subject


def test_recommend_new_student_with_completed_lesson_continues():
    r = client.post("/recommend", json={"studentId": 5, "answers": [], "lessons": LESSONS})
    body = r.json()
    kinds = {x["lessonId"]: x["kind"] for x in body["recommendations"]}
    assert kinds == {4: "CONTINUE", 10: "START"}


def test_recommend_empty_lessons():
    answers = [_answer("linear-equations", False) for _ in range(3)]
    r = client.post("/recommend", json={"studentId": 1, "answers": answers, "lessons": []})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["recommendations"] == []
    assert body["weakTopics"][0]["topic"] == "linear-equations"


def test_recommend_limit_respected():
    answers = [_answer("linear-equations", False) for _ in range(5)]
    r = client.post("/recommend", json={"studentId": 1, "answers": answers, "lessons": LESSONS, "limit": 1})
    recs = r.json()["recommendations"]
    assert len(recs) == 1 and recs[0]["kind"] == "REVISE"


# ---------------------------------------------------------------------------
# /segments
# ---------------------------------------------------------------------------
def _student(sid, score, lessons, attempts, days, name=None):
    return {"studentId": sid, "name": name or f"S{sid}", "avgScore": score,
            "lessonsCompleted": lessons, "quizAttempts": attempts, "activeDays": days}


def test_segments_kmeans():
    students = [
        _student(1, 35, 1, 3, 2), _student(2, 42, 2, 4, 3),      # low
        _student(3, 65, 5, 6, 6), _student(4, 70, 6, 7, 7),      # middle
        _student(5, 92, 12, 12, 14), _student(6, 95, 14, 13, 15),  # high
        _student(7, 0, 0, 0, 0),                                  # no attempts
    ]
    r = client.post("/segments", json={"students": students})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["model"] == "kmeans-k3"
    seg = {s["studentId"]: s for s in body["segments"]}
    assert [s["studentId"] for s in body["segments"]] == [1, 2, 3, 4, 5, 6, 7]
    assert seg[1]["segment"] == seg[2]["segment"] == "NEEDS_SUPPORT"
    assert seg[3]["segment"] == seg[4]["segment"] == "ON_TRACK"
    assert seg[5]["segment"] == seg[6]["segment"] == "ADVANCED"
    assert seg[7]["segment"] == "NEEDS_SUPPORT" and seg[7]["reason"] == "No quiz attempts yet"
    assert seg[7]["cluster"] == -1
    summaries = {c["segment"]: c for c in body["clusterSummaries"]}
    assert summaries["NEEDS_SUPPORT"]["count"] == 3
    assert summaries["ADVANCED"]["avgScore"] == pytest.approx(93.5)


def test_segments_safety_rule_overrides_cluster():
    # Student 3 (48%) lands in the middle cluster with the mid-50s students,
    # but the safety rule forces NEEDS_SUPPORT.
    students = [
        _student(1, 20, 5, 5, 5), _student(2, 22, 5, 5, 5),
        _student(3, 48, 5, 5, 5), _student(4, 55, 5, 5, 5), _student(5, 58, 5, 5, 5),
        _student(6, 90, 5, 5, 5), _student(7, 92, 5, 5, 5),
    ]
    body = client.post("/segments", json={"students": students}).json()
    assert body["model"] == "kmeans-k3"
    seg = {s["studentId"]: s for s in body["segments"]}
    assert seg[4]["segment"] == seg[5]["segment"] == "ON_TRACK"
    assert seg[3]["cluster"] == seg[4]["cluster"]  # clustered with the ON_TRACK group...
    assert seg[3]["segment"] == "NEEDS_SUPPORT"  # ...but < 50 is always NEEDS_SUPPORT
    assert "safety rule" in seg[3]["reason"]


def test_segments_rules_when_few_students():
    students = [_student(1, 45, 1, 2, 1), _student(2, 85, 9, 8, 10)]
    r = client.post("/segments", json={"students": students})
    assert r.status_code == 200
    body = r.json()
    assert body["model"] == "rules"
    seg = {s["studentId"]: s["segment"] for s in body["segments"]}
    assert seg == {1: "NEEDS_SUPPORT", 2: "ADVANCED"}


def test_segments_identical_students_fall_back_to_rules():
    students = [_student(i, 70, 3, 3, 3) for i in range(1, 5)]
    body = client.post("/segments", json={"students": students}).json()
    assert body["model"] == "rules"
    assert {s["segment"] for s in body["segments"]} == {"ON_TRACK"}


def test_segments_empty():
    r = client.post("/segments", json={"students": []})
    assert r.status_code == 200
    assert r.json() == {"segments": [], "model": "rules", "clusterSummaries": []}


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
@pytest.mark.parametrize(
    "path,payload",
    [
        ("/recommend", {"answers": []}),  # missing studentId
        ("/recommend", {"studentId": 1, "answers": [{"topic": "x"}]}),  # incomplete answer
        ("/recommend", {"studentId": 1, "answers": [], "lessons": [], "limit": 0}),
        ("/recommend", {"studentId": "abc"}),
        ("/segments", {"students": [{"studentId": 1, "avgScore": 150, "lessonsCompleted": 1,
                                     "quizAttempts": 1, "activeDays": 1}]}),
        ("/segments", {"students": "nope"}),
    ],
)
def test_validation_422(path, payload):
    assert client.post(path, json=payload).status_code == 422
