package com.shikshasetu.teacher;

import java.time.Instant;
import java.time.LocalDate;

public record AssignmentView(Long id, String title, String note, LocalDate dueDate, Long lessonId, String lessonTitle,
                             Long quizId, String quizTitle, Long chapterId, String teacherName, Long studentId,
                             String studentName, Instant createdAt, Boolean completed, Integer completedCount,
                             Integer targetCount) {
}
