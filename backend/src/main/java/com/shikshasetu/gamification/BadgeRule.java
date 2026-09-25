package com.shikshasetu.gamification;

import java.util.function.Predicate;

/** Badge catalogue and the rule that unlocks each badge. */
public enum BadgeRule {
    FIRST_LESSON("First Step", "Complete your first lesson.", "footprints",
            s -> s.lessonsCompleted() >= 1),
    QUIZ_STARTER("Quiz Starter", "Finish your first quiz.", "clipboard-check",
            s -> s.quizAttempts() >= 1),
    PERFECT_SCORE("Perfect Score", "Score 100% on any quiz.", "target",
            StudentStats::hasPerfectScore),
    STREAK_3("On a Roll", "Learn 3 days in a row.", "flame",
            s -> s.longestStreak() >= 3),
    STREAK_7("Week Warrior", "Learn 7 days in a row.", "calendar-check",
            s -> s.longestStreak() >= 7),
    MATH_EXPLORER("Math Explorer", "Complete 3 Mathematics lessons.", "calculator",
            s -> s.lessonsInSubject("math") >= 3),
    SCIENCE_EXPLORER("Science Explorer", "Complete a lesson in Physics, Chemistry and Biology.", "atom",
            s -> s.lessonsInSubject("physics") >= 1 && s.lessonsInSubject("chemistry") >= 1 && s.lessonsInSubject("biology") >= 1),
    QUIZ_MASTER("Quiz Master", "Score 80% or more on 5 quizzes.", "trophy",
            s -> s.quizzesAbove80() >= 5),
    RISING_STAR("Rising Star", "Earn 500 XP.", "star",
            s -> s.xp() >= 500);

    private final String displayName;
    private final String description;
    private final String icon;
    private final Predicate<StudentStats> rule;

    BadgeRule(String displayName, String description, String icon, Predicate<StudentStats> rule) {
        this.displayName = displayName;
        this.description = description;
        this.icon = icon;
        this.rule = rule;
    }

    public String displayName() { return displayName; }

    public String description() { return description; }

    public String icon() { return icon; }

    public boolean isMet(StudentStats stats) { return rule.test(stats); }
}
