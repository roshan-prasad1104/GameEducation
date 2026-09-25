package com.shikshasetu.content;

import java.util.List;

public final class CatalogDtos {
    private CatalogDtos() {}

    public record SubjectRef(Long id, String code, String name, String color, String icon) {
        static SubjectRef of(Subject s) {
            return new SubjectRef(s.getId(), s.getCode(), ContentText.name(s), s.getColor(), s.getIcon());
        }
    }

    public record ChapterRef(Long id, String title, int position) {
        static ChapterRef of(Chapter c) {
            return new ChapterRef(c.getId(), ContentText.title(c), c.getPosition());
        }
    }

    public record SubjectCard(Long id, String code, String name, String description, String color, String icon,
                              Integer gradeLevel, int chapterCount, int lessonCount, int completedLessons,
                              int progressPercent) {}

    public record SubjectDetail(SubjectCard subject, List<ChapterCard> chapters) {}

    public record ChapterCard(Long id, String title, String description, int position, int lessonCount,
                              int completedLessons, QuizCard quiz) {}

    public record LessonCard(Long id, String title, String summary, String topic, int durationMinutes,
                             int position, boolean completed) {}

    public record QuizCard(Long id, String title, String description, int questionCount, int timeLimitSeconds,
                           Integer bestPercentage) {}

    public record ChapterDetail(Long id, String title, String description, int position, SubjectRef subject,
                                List<LessonCard> lessons, QuizCard quiz, int completedLessons) {}

    /** {@code language}: the language the body is served in (English when no translation exists). */
    public record LessonDetail(Long id, String title, String summary, String topic, String content, String videoUrl,
                               int durationMinutes, int position, boolean completed, ChapterRef chapter,
                               SubjectRef subject, Long prevLessonId, Long nextLessonId, Long quizId,
                               String language) {}

    /** Questions are sent without the correct answer; grading always happens on the server. */
    public record QuestionView(Long id, String prompt, List<String> options, String topic, int position) {}

    public record QuizView(Long id, String title, String description, int timeLimitSeconds, ChapterRef chapter,
                           SubjectRef subject, List<QuestionView> questions, String language) {}

    public record OutlineItem(Long id, String title) {}

    public record OutlineChapter(Long id, String title, List<OutlineItem> lessons, OutlineItem quiz) {}

    public record OutlineSubject(Long id, String name, List<OutlineChapter> chapters) {}

    /** Everything needed to study a chapter offline. */
    public record OfflineBundle(ChapterDetail chapter, List<LessonDetail> lessons, QuizView quiz) {}
}
