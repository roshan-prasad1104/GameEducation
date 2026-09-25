package com.shikshasetu.ai;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Wire format shared with the Python FastAPI service (see ai-service/README.md). */
public final class AiDtos {
    private AiDtos() {}

    public record AnswerRow(String topic, Long subjectId, String subjectName, boolean correct, Instant answeredAt) {}

    public record LessonRow(Long lessonId, String title, String topic, Long subjectId, String subjectName,
                            Long chapterId, String chapterTitle, int order, boolean completed) {}

    public record RecommendRequest(Long studentId, List<AnswerRow> answers, List<LessonRow> lessons, int limit) {}

    public record SubjectMastery(Long subjectId, String subjectName, double mastery, int answered) {}

    public record WeakTopic(String topic, Long subjectId, String subjectName, double mastery, int answered, int correct) {}

    public record RecommendationItem(Long lessonId, String title, Long subjectId, String subjectName, Long chapterId,
                                     String chapterTitle, String topic, String kind, double priority, String reason) {}

    public record RecommendResponse(Long studentId, List<SubjectMastery> subjectMastery, List<WeakTopic> weakTopics,
                                    List<RecommendationItem> recommendations, String model, Instant generatedAt) {}

    /**
     * A recommendation as the app shows it: names in the request language, the model's own English
     * explanation ({@code reason}) and the facts behind it ({@code reasonParams}) so the app can
     * phrase the explanation in the student's language.
     */
    public record RecommendationView(Long lessonId, String title, Long subjectId, String subjectName, Long chapterId,
                                     String chapterTitle, String topic, String kind, double priority, String reason,
                                     Map<String, Object> reasonParams) {}

    /** What the backend returns to the frontend: the AI response plus where it came from. */
    public record RecommendationsView(List<SubjectMastery> subjectMastery, List<WeakTopic> weakTopics,
                                      List<RecommendationView> recommendations, String model, String source,
                                      Instant generatedAt) {}

    public record SegmentStudent(Long studentId, String name, double avgScore, int lessonsCompleted,
                                 int quizAttempts, int activeDays) {}

    public record SegmentRequest(List<SegmentStudent> students) {}

    public record Segment(Long studentId, String segment, Integer cluster, String reason) {}

    public record ClusterSummary(String segment, int count, double avgScore, double avgLessons) {}

    public record SegmentResponse(List<Segment> segments, String model, List<ClusterSummary> clusterSummaries) {}
}
