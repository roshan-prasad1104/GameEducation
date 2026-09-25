package com.shikshasetu.gamification;

import java.util.Map;

/** Snapshot of a student's achievements used to evaluate badge rules. */
public record StudentStats(long lessonsCompleted, long quizAttempts, boolean hasPerfectScore,
                           long quizzesAbove80, int longestStreak, int xp,
                           Map<String, Long> lessonsBySubjectCode) {

    public long lessonsInSubject(String code) {
        return lessonsBySubjectCode.getOrDefault(code, 0L);
    }
}
