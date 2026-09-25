"""Mastery estimation and lesson recommendation (pure functions, no I/O).

Mastery model ("bayesian-mastery-v1")
-------------------------------------
For a set of answers we compute a recency-weighted, Bayesian-smoothed accuracy:

    w_i      = 0.5 ** (age_days_i / HALF_LIFE_DAYS)          # recency weight
    mastery  = (sum(w_i * correct_i) + PRIOR_A) / (sum(w_i) + PRIOR_A + PRIOR_B)

With a Beta(1, 1) prior an untested topic sits at 0.5, and a handful of answers
only moves the estimate part of the way - this avoids "0% after one wrong
answer" style overreactions. It is a simple statistical estimate, not deep
learning.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional, Sequence, Set, Tuple

import numpy as np
import pandas as pd

from schemas import (
    AnswerIn,
    LessonIn,
    Recommendation,
    SubjectMastery,
    WeakTopic,
)

MODEL_NAME = "bayesian-mastery-v1"

HALF_LIFE_DAYS = 14.0
PRIOR_A = 1.0  # pseudo-count of correct answers
PRIOR_B = 1.0  # pseudo-count of wrong answers

WEAK_THRESHOLD = 0.6      # mastery below this is "weak"...
WEAK_MIN_ANSWERED = 2     # ...but only if we have at least this much evidence
MAX_WEAK_TOPICS = 5
CONFIDENCE_FULL_AT = 5    # answers needed for full confidence in a weak topic

REVISE_BOOST = 0.15       # small bump so well-evidenced weak spots come first
CONTINUE_BASE = 0.35      # CONTINUE priority range: 0.35 .. 0.55
CONTINUE_SPAN = 0.20
START_BASE = 0.30         # START priority (tiny decrement keeps curriculum order)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def topic_display_name(slug: str) -> str:
    """'linear-equations' -> 'Linear Equations'."""
    parts = slug.replace("_", "-").split("-")
    return " ".join(p[:1].upper() + p[1:] for p in parts if p)


def _to_utc(ts: datetime) -> datetime:
    """Treat naive timestamps as UTC."""
    return ts.replace(tzinfo=timezone.utc) if ts.tzinfo is None else ts.astimezone(timezone.utc)


def smoothed_mastery(correct: np.ndarray, age_days: np.ndarray) -> float:
    """Recency-weighted, Beta(PRIOR_A, PRIOR_B)-smoothed accuracy in [0, 1]."""
    correct = np.asarray(correct, dtype=float)
    age_days = np.clip(np.asarray(age_days, dtype=float), 0.0, None)  # future -> age 0
    weights = np.power(0.5, age_days / HALF_LIFE_DAYS)
    return float((np.sum(weights * correct) + PRIOR_A) / (np.sum(weights) + PRIOR_A + PRIOR_B))


def answers_frame(answers: Sequence[AnswerIn], now: datetime) -> pd.DataFrame:
    """Flatten answers into a DataFrame with an `age_days` column."""
    cols = ["topic", "subject_id", "subject_name", "correct", "age_days"]
    if not answers:
        return pd.DataFrame(columns=cols)
    now = _to_utc(now)
    rows = [
        {
            "topic": a.topic,
            "subject_id": a.subject_id,
            "subject_name": a.subject_name,
            "correct": 1.0 if a.correct else 0.0,
            "age_days": (now - _to_utc(a.answered_at)).total_seconds() / 86400.0,
        }
        for a in answers
    ]
    return pd.DataFrame(rows, columns=cols)


# ---------------------------------------------------------------------------
# Mastery
# ---------------------------------------------------------------------------
def compute_topic_mastery(df: pd.DataFrame) -> pd.DataFrame:
    """One row per (subject_id, topic): mastery, answered, correct."""
    out_cols = ["topic", "subject_id", "subject_name", "mastery", "answered", "correct"]
    if df.empty:
        return pd.DataFrame(columns=out_cols)
    rows = []
    for (subject_id, topic), g in df.groupby(["subject_id", "topic"], sort=False):
        rows.append(
            {
                "topic": topic,
                "subject_id": int(subject_id),
                "subject_name": str(g["subject_name"].iloc[0]),
                "mastery": smoothed_mastery(g["correct"].to_numpy(), g["age_days"].to_numpy()),
                "answered": int(len(g)),
                "correct": int(g["correct"].sum()),
            }
        )
    return pd.DataFrame(rows, columns=out_cols)


def compute_subject_mastery(df: pd.DataFrame) -> List[SubjectMastery]:
    """Mastery per subject over all its answers, sorted ascending by mastery."""
    if df.empty:
        return []
    result = []
    for subject_id, g in df.groupby("subject_id", sort=False):
        result.append(
            SubjectMastery(
                subject_id=int(subject_id),
                subject_name=str(g["subject_name"].iloc[0]),
                mastery=round(smoothed_mastery(g["correct"].to_numpy(), g["age_days"].to_numpy()), 3),
                answered=int(len(g)),
            )
        )
    result.sort(key=lambda s: (s.mastery, s.subject_id))
    return result


def find_weak_topics(topic_df: pd.DataFrame) -> pd.DataFrame:
    """All topics with mastery < threshold and enough evidence, weakest first."""
    if topic_df.empty:
        return topic_df
    weak = topic_df[(topic_df["mastery"] < WEAK_THRESHOLD) & (topic_df["answered"] >= WEAK_MIN_ANSWERED)]
    return weak.sort_values(["mastery", "answered"], ascending=[True, False], kind="stable")


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------
def _rec(lesson: LessonIn, kind: str, priority: float, reason: str) -> Recommendation:
    return Recommendation(
        lesson_id=lesson.lesson_id,
        title=lesson.title,
        subject_id=lesson.subject_id,
        subject_name=lesson.subject_name,
        chapter_id=lesson.chapter_id,
        chapter_title=lesson.chapter_title,
        topic=lesson.topic,
        kind=kind,  # type: ignore[arg-type]
        priority=round(float(min(1.0, max(0.0, priority))), 3),
        reason=reason,
    )


def build_recommendations(
    lessons: Sequence[LessonIn],
    weak_df: pd.DataFrame,
    answered_subjects: Set[int],
    limit: int,
) -> List[Recommendation]:
    """Rank REVISE / CONTINUE / START lessons. `lessons` is in curriculum order."""
    if not lessons:
        return []

    recs: List[Recommendation] = []
    used: Set[int] = set()

    # Subjects in first-seen curriculum order, with their lessons in order.
    by_subject: Dict[int, List[LessonIn]] = {}
    for lesson in lessons:
        by_subject.setdefault(lesson.subject_id, []).append(lesson)

    # 1) REVISE: first lesson (curriculum order) covering each weak topic.
    for row in weak_df.itertuples(index=False):
        lesson = next(
            (
                l
                for l in lessons
                if l.topic == row.topic and l.subject_id == row.subject_id and l.lesson_id not in used
            ),
            None,
        )
        if lesson is None:
            continue  # no lesson in the catalog covers this topic
        confidence = min(1.0, row.answered / CONFIDENCE_FULL_AT)
        priority = (1.0 - row.mastery) * confidence + REVISE_BOOST
        name = topic_display_name(row.topic)
        again = " You've completed it before, but a second pass is worthwhile." if lesson.completed else ""
        reason = (
            f"Your estimated mastery of {name} is {row.mastery:.0%} "
            f"({row.correct}/{row.answered} quiz answers correct, recent answers weighted more). "
            f"Revisiting this lesson should help.{again}"
        )
        recs.append(_rec(lesson, "REVISE", priority, reason))
        used.add(lesson.lesson_id)

    # 2) CONTINUE (subject already started) / 3) START (untouched subject), one per subject.
    start_rank = 0
    for subject_id, subj_lessons in by_subject.items():
        total = len(subj_lessons)
        done = sum(1 for l in subj_lessons if l.completed)
        started = done > 0 or subject_id in answered_subjects
        nxt: Optional[LessonIn] = next(
            (l for l in subj_lessons if not l.completed and l.lesson_id not in used), None
        )
        if nxt is None:
            continue  # subject finished (or remaining lessons already picked as REVISE)
        subject_name = subj_lessons[0].subject_name
        if started:
            progress = done / total
            priority = CONTINUE_BASE + CONTINUE_SPAN * (1.0 - progress)
            reason = (
                f"Next step in {subject_name}: you've completed {done} of {total} lessons "
                f"({progress:.0%}). This is the next lesson in {nxt.chapter_title}."
            )
            recs.append(_rec(nxt, "CONTINUE", priority, reason))
        else:
            priority = START_BASE - 0.01 * start_rank
            start_rank += 1
            reason = (
                f"You haven't started {subject_name} yet. "
                f"This is its first lesson ({nxt.chapter_title})."
            )
            recs.append(_rec(nxt, "START", priority, reason))
        used.add(nxt.lesson_id)

    recs.sort(key=lambda r: r.priority, reverse=True)  # stable: ties keep insertion order
    return recs[:limit]


def recommend(
    answers: Sequence[AnswerIn],
    lessons: Sequence[LessonIn],
    limit: int,
    now: Optional[datetime] = None,
) -> Tuple[List[SubjectMastery], List[WeakTopic], List[Recommendation]]:
    """Full pipeline: mastery -> weak topics -> ranked recommendations."""
    now = now or datetime.now(timezone.utc)
    df = answers_frame(answers, now)
    topic_df = compute_topic_mastery(df)
    weak_df = find_weak_topics(topic_df)

    subject_mastery = compute_subject_mastery(df)
    weak_topics = [
        WeakTopic(
            topic=r.topic,
            subject_id=int(r.subject_id),
            subject_name=r.subject_name,
            mastery=round(float(r.mastery), 3),
            answered=int(r.answered),
            correct=int(r.correct),
        )
        for r in weak_df.head(MAX_WEAK_TOPICS).itertuples(index=False)
    ]
    answered_subjects = {int(s) for s in df["subject_id"].unique()} if not df.empty else set()
    recs = build_recommendations(lessons, weak_df, answered_subjects, limit)
    return subject_mastery, weak_topics, recs
