package com.shikshasetu.learning;

import java.time.Instant;

/** Flattened view of one answered question — the raw input for weak-topic analysis. */
public record AnswerFact(Long studentId, String topic, Long subjectId, String subjectName,
                         boolean correct, Instant answeredAt) {
}
