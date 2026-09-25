package com.shikshasetu.gamification;

import java.time.Instant;
import java.util.List;

public final class GamificationDtos {
    private GamificationDtos() {}

    public record BadgeView(String code, String name, String description, String icon, boolean earned, Instant earnedAt) {}

    public record MissionView(String code, String title, String description, int progress, int target,
                              int xpReward, boolean completed) {}

    /** Returned after every rewarded action so the UI can celebrate precisely what changed. */
    public record RewardSummary(int xpEarned, int totalXp, Levels.LevelInfo level, boolean leveledUp,
                                int streak, List<BadgeView> newBadges, List<MissionView> completedMissions) {}

    public record XpEntry(int amount, String source, String description, Instant createdAt) {}

    public record XpSummary(int totalXp, Levels.LevelInfo level, long xpThisWeek, List<XpEntry> recent) {}

    public record LeaderboardEntry(int rank, Long studentId, String name, Integer gradeLevel, String school,
                                   int xp, int level, int streak, boolean currentUser) {}

    public record Leaderboard(List<LeaderboardEntry> entries, LeaderboardEntry me) {}
}
