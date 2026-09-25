"""Student segmentation into support groups using scikit-learn KMeans.

Pipeline
--------
1. Students with zero quiz attempts are set aside as NEEDS_SUPPORT
   ("No quiz attempts yet") - there is no score signal to cluster on.
2. If at least 3 of the remaining students exist and they form at least 2
   distinct feature rows, features [avgScore, lessonsCompleted, quizAttempts,
   activeDays] are standardised (StandardScaler) and clustered with
   KMeans(k = min(3, distinct rows)). Clusters are named by ranking their
   centroid avgScore (lowest -> NEEDS_SUPPORT, highest -> ADVANCED, ...).
3. Safety rule: avgScore < 50 with >= 1 quiz attempt is always NEEDS_SUPPORT.
4. Otherwise (too little data) simple score thresholds are used (model "rules").

Clusters are relative to the cohort that is sent in, so labels are indicative,
not a diagnosis.
"""
from __future__ import annotations

from typing import Dict, List, Sequence, Tuple

import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from schemas import ClusterSummary, SegmentsResponse, StudentFeatures, StudentSegment

SEGMENT_ORDER = ["NEEDS_SUPPORT", "ON_TRACK", "ADVANCED"]
SUPPORT_SCORE = 50.0
ADVANCED_SCORE = 80.0
MIN_STUDENTS_FOR_KMEANS = 3


def _features(students: Sequence[StudentFeatures]) -> np.ndarray:
    return np.array(
        [[s.avg_score, s.lessons_completed, s.quiz_attempts, s.active_days] for s in students],
        dtype=float,
    )


def _rule_segment(s: StudentFeatures) -> Tuple[str, str]:
    """Threshold rules used when there is too little data to cluster."""
    if s.avg_score < SUPPORT_SCORE:
        return "NEEDS_SUPPORT", f"Average quiz score {s.avg_score:.1f}% is below {SUPPORT_SCORE:.0f}%."
    if s.avg_score >= ADVANCED_SCORE:
        return "ADVANCED", f"Average quiz score {s.avg_score:.1f}% is at or above {ADVANCED_SCORE:.0f}%."
    return (
        "ON_TRACK",
        f"Average quiz score {s.avg_score:.1f}% is between {SUPPORT_SCORE:.0f}% and {ADVANCED_SCORE:.0f}%.",
    )


def _label_clusters(centroid_scores: np.ndarray) -> Dict[int, str]:
    """Map cluster index -> segment name by ranking centroid avgScore."""
    ranked = [int(i) for i in np.argsort(centroid_scores)]  # lowest score first
    labels: Dict[int, str] = {}
    if len(ranked) == 3:
        labels[ranked[0]], labels[ranked[1]], labels[ranked[2]] = "NEEDS_SUPPORT", "ON_TRACK", "ADVANCED"
    else:  # 2 clusters
        labels[ranked[0]] = "NEEDS_SUPPORT"
        top = ranked[-1]
        labels[top] = "ADVANCED" if centroid_scores[top] >= ADVANCED_SCORE else "ON_TRACK"
    return labels


def _summaries(students: Sequence[StudentFeatures], segs: List[StudentSegment]) -> List[ClusterSummary]:
    by_id = {s.student_id: s for s in students}
    out: List[ClusterSummary] = []
    for name in SEGMENT_ORDER:
        members = [by_id[g.student_id] for g in segs if g.segment == name]
        if not members:
            continue
        out.append(
            ClusterSummary(
                segment=name,  # type: ignore[arg-type]
                count=len(members),
                avg_score=round(float(np.mean([m.avg_score for m in members])), 1),
                avg_lessons=round(float(np.mean([m.lessons_completed for m in members])), 1),
            )
        )
    return out


def segment_students(students: Sequence[StudentFeatures]) -> SegmentsResponse:
    if not students:
        return SegmentsResponse(segments=[], model="rules", cluster_summaries=[])

    no_attempts = [s for s in students if s.quiz_attempts == 0]
    active = [s for s in students if s.quiz_attempts > 0]
    result: Dict[int, StudentSegment] = {}

    for s in no_attempts:
        result[s.student_id] = StudentSegment(
            student_id=s.student_id, segment="NEEDS_SUPPORT", cluster=-1, reason="No quiz attempts yet"
        )

    X = _features(active) if active else np.empty((0, 4))
    n_distinct = len(np.unique(X, axis=0)) if len(active) else 0
    use_kmeans = len(active) >= MIN_STUDENTS_FOR_KMEANS and n_distinct >= 2

    if use_kmeans:
        k = min(3, n_distinct)
        scaler = StandardScaler()
        Xs = scaler.fit_transform(X)
        km = KMeans(n_clusters=k, n_init=10, random_state=42).fit(Xs)
        centroids = scaler.inverse_transform(km.cluster_centers_)  # back to original units
        labels = _label_clusters(centroids[:, 0])
        sizes = np.bincount(km.labels_, minlength=k)

        for s, c in zip(active, km.labels_):
            c = int(c)
            seg = labels[c]
            reason = (
                f"Clustered into a group of {sizes[c]} student(s) with similar activity "
                f"(group average score {centroids[c, 0]:.1f}%, {centroids[c, 1]:.1f} lessons completed). "
                f"Your average score is {s.avg_score:.1f}% over {s.quiz_attempts} quiz attempt(s)."
            )
            if s.avg_score < SUPPORT_SCORE and seg != "NEEDS_SUPPORT":
                seg = "NEEDS_SUPPORT"
                reason = (
                    f"Average quiz score {s.avg_score:.1f}% is below {SUPPORT_SCORE:.0f}% "
                    f"(safety rule overrides the cluster label)."
                )
            result[s.student_id] = StudentSegment(
                student_id=s.student_id, segment=seg, cluster=c, reason=reason  # type: ignore[arg-type]
            )
        model = f"kmeans-k{k}"
    else:
        for s in active:
            seg, reason = _rule_segment(s)
            result[s.student_id] = StudentSegment(
                student_id=s.student_id, segment=seg, cluster=-1, reason=reason  # type: ignore[arg-type]
            )
        model = "rules"

    # Preserve the caller's input order.
    segments = [result[s.student_id] for s in students if s.student_id in result]
    return SegmentsResponse(segments=segments, model=model, cluster_summaries=_summaries(students, segments))
