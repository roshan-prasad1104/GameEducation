package com.shikshasetu.gamification;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LevelsTest {

    @Test
    void levelThresholdsMatchTheDocumentedCurve() {
        assertThat(Levels.levelFor(0)).isEqualTo(1);
        assertThat(Levels.levelFor(99)).isEqualTo(1);
        assertThat(Levels.levelFor(100)).isEqualTo(2);
        assertThat(Levels.levelFor(249)).isEqualTo(2);
        assertThat(Levels.levelFor(250)).isEqualTo(3);
        assertThat(Levels.levelFor(449)).isEqualTo(3);
        assertThat(Levels.levelFor(450)).isEqualTo(4);
    }

    @Test
    void levelInfoReportsProgressWithinLevel() {
        Levels.LevelInfo info = Levels.info(300);
        assertThat(info.level()).isEqualTo(3);
        assertThat(info.levelStartXp()).isEqualTo(250);
        assertThat(info.nextLevelXp()).isEqualTo(450);
        assertThat(info.xpIntoLevel()).isEqualTo(50);
        assertThat(info.xpForLevel()).isEqualTo(200);
    }
}
