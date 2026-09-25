"""Pydantic v2 models for the AI recommender service.

All JSON field names are camelCase on the wire (the Spring Boot backend's
convention); Python attributes are snake_case.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base model: camelCase aliases, accepts either name on input."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


# ---------------------------------------------------------------------------
# /recommend
# ---------------------------------------------------------------------------
class AnswerIn(CamelModel):
    topic: str = Field(min_length=1)
    subject_id: int
    subject_name: str
    correct: bool
    answered_at: datetime


class LessonIn(CamelModel):
    lesson_id: int
    title: str
    topic: str
    subject_id: int
    subject_name: str
    chapter_id: int
    chapter_title: str
    order: int
    completed: bool = False


class RecommendRequest(CamelModel):
    student_id: int
    answers: List[AnswerIn] = Field(default_factory=list)
    lessons: List[LessonIn] = Field(default_factory=list)
    limit: int = Field(default=4, ge=1, le=50)


class SubjectMastery(CamelModel):
    subject_id: int
    subject_name: str
    mastery: float
    answered: int


class WeakTopic(CamelModel):
    topic: str
    subject_id: int
    subject_name: str
    mastery: float
    answered: int
    correct: int


RecommendationKind = Literal["REVISE", "CONTINUE", "START"]


class Recommendation(CamelModel):
    lesson_id: int
    title: str
    subject_id: int
    subject_name: str
    chapter_id: int
    chapter_title: str
    topic: str
    kind: RecommendationKind
    priority: float
    reason: str


class RecommendResponse(CamelModel):
    student_id: int
    subject_mastery: List[SubjectMastery]
    weak_topics: List[WeakTopic]
    recommendations: List[Recommendation]
    model: str
    generated_at: str


# ---------------------------------------------------------------------------
# /segments
# ---------------------------------------------------------------------------
SegmentName = Literal["NEEDS_SUPPORT", "ON_TRACK", "ADVANCED"]


class StudentFeatures(CamelModel):
    student_id: int
    name: Optional[str] = None
    avg_score: float = Field(ge=0, le=100)
    lessons_completed: int = Field(ge=0)
    quiz_attempts: int = Field(ge=0)
    active_days: int = Field(ge=0)


class SegmentsRequest(CamelModel):
    students: List[StudentFeatures] = Field(default_factory=list)


class StudentSegment(CamelModel):
    student_id: int
    segment: SegmentName
    # KMeans cluster index; -1 when the student was assigned by a rule
    # (rules model, or excluded from clustering because of zero quiz attempts).
    cluster: int
    reason: str


class ClusterSummary(CamelModel):
    segment: SegmentName
    count: int
    avg_score: float
    avg_lessons: float


class SegmentsResponse(CamelModel):
    segments: List[StudentSegment]
    model: str
    cluster_summaries: List[ClusterSummary]
