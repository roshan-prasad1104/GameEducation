"""FastAPI entry point for the AI recommender microservice.

Run from this directory:  uvicorn main:app --port 8000
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI

from recommender import MODEL_NAME, recommend
from schemas import RecommendRequest, RecommendResponse, SegmentsRequest, SegmentsResponse
from segmentation import segment_students

SERVICE_NAME = "ai-recommender"
VERSION = "1.0.0"

app = FastAPI(
    title="GameEducation AI Recommender",
    version=VERSION,
    description="Explainable mastery estimates, lesson recommendations and student segmentation.",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": SERVICE_NAME, "version": VERSION}


@app.post("/recommend", response_model=RecommendResponse, response_model_by_alias=True)
def post_recommend(req: RecommendRequest) -> RecommendResponse:
    subject_mastery, weak_topics, recs = recommend(req.answers, req.lessons, req.limit)
    return RecommendResponse(
        student_id=req.student_id,
        subject_mastery=subject_mastery,
        weak_topics=weak_topics,
        recommendations=recs,
        model=MODEL_NAME,
        generated_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    )


@app.post("/segments", response_model=SegmentsResponse, response_model_by_alias=True)
def post_segments(req: SegmentsRequest) -> SegmentsResponse:
    return segment_students(req.students)
