package com.shikshasetu.content;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Translated text for curriculum content, stored in one table per content type keyed by
 * (id, language). English stays in the main tables and is the fallback for anything missing.
 * Structural data (order, answer key, topics, durations) is never translated.
 */
public final class Translations {
    private Translations() {}

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SubjectText {
        @Column(nullable = false, length = 200)
        private String name;
        @Column(length = 800)
        private String description;
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChapterText {
        @Column(nullable = false, length = 300)
        private String title;
        @Column(length = 800)
        private String description;
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonText {
        @Column(nullable = false, length = 300)
        private String title;
        @Column(length = 800)
        private String summary;
        @Column(nullable = false, length = 40000)
        private String content;
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizText {
        @Column(nullable = false, length = 300)
        private String title;
        @Column(length = 800)
        private String description;
    }

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionText {
        @Column(nullable = false, length = 2000)
        private String prompt;
        @Column(length = 2000)
        private String explanation;
    }

    /** One translated option; options keep the English order because the answer key is shared. */
    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionText {
        @Column(nullable = false, length = 8)
        private String language;
        @Column(name = "option_index", nullable = false)
        private int optionIndex;
        @Column(name = "option_text", nullable = false, length = 800)
        private String text;
    }
}
