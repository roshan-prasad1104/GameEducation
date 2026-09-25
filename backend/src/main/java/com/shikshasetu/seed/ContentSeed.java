package com.shikshasetu.seed;

import java.util.List;

/** Shape of src/main/resources/seed/content.json. */
record ContentSeed(List<SubjectSeed> subjects) {

    record SubjectSeed(String code, String name, String description, String color, String icon, Integer gradeLevel,
                       List<ChapterSeed> chapters) {}

    record ChapterSeed(String title, String description, List<LessonSeed> lessons, QuizSeed quiz) {}

    record LessonSeed(String title, String topic, String summary, int durationMinutes, String content, String videoUrl) {}

    record QuizSeed(String title, String description, int timeLimitSeconds, List<QuestionSeed> questions) {}

    record QuestionSeed(String prompt, List<String> options, int correctIndex, String explanation, String topic) {}
}
