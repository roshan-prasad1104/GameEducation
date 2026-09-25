package com.shikshasetu.gamification;

/**
 * Deterministic XP → level curve. Each level needs 50 XP more than the previous one:
 * L1 0–99, L2 100–249, L3 250–449, L4 450–699 ...  threshold(L) = 25·(L−1)·(L+2).
 */
public final class Levels {
    private Levels() {}

    public static int thresholdFor(int level) {
        return 25 * (level - 1) * (level + 2);
    }

    public static int levelFor(int xp) {
        int level = 1;
        while (thresholdFor(level + 1) <= xp) level++;
        return level;
    }

    public static LevelInfo info(int xp) {
        int level = levelFor(xp);
        int start = thresholdFor(level);
        int next = thresholdFor(level + 1);
        return new LevelInfo(level, xp, start, next, xp - start, next - start);
    }

    /** xpIntoLevel / xpForLevel drives the progress bar to the next level. */
    public record LevelInfo(int level, int xp, int levelStartXp, int nextLevelXp, int xpIntoLevel, int xpForLevel) {}
}
