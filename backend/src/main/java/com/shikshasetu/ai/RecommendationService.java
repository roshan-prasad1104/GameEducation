package com.shikshasetu.ai;

import com.shikshasetu.ai.AiDtos.*;
import com.shikshasetu.content.Lesson;
import com.shikshasetu.content.LessonRepository;
import com.shikshasetu.learning.AnswerFact;
import com.shikshasetu.learning.AttemptAnswerRepository;
import com.shikshasetu.learning.LessonProgressRepository;
import com.shikshasetu.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Collects a student's learning data, asks the Python model for recommendations
 * (falling back to Java rules if it is down) and stores the latest snapshot.
 */
@Service
@RequiredArgsConstructor
public class RecommendationService {
    public static final String SOURCE_AI = "ai-service";
    public static final String SOURCE_FALLBACK = "fallback";

    private final AiClient ai;
    private final AttemptAnswerRepository answers;
    private final LessonRepository lessons;
    private final LessonProgressRepository progress;
    private final RecommendationRepository recommendations;
    private final UserRepository users;

    @Transactional
    public RecommendationsView forStudent(Long studentId, int limit) {
        List<AnswerRow> answerRows = answers.findFactsForStudents(List.of(studentId)).stream()
                .map(f -> new AnswerRow(f.topic(), f.subjectId(), f.subjectName(), f.correct(), f.answeredAt()))
                .toList();
        Set<Long> done = progress.findCompletedLessonIds(studentId);
        List<Lesson> catalog = lessons.findAllInCurriculumOrder();
        List<LessonRow> lessonRows = catalog.stream()
                .map(l -> new LessonRow(l.getId(), l.getTitle(), l.getTopic(), l.getChapter().getSubject().getId(),
                        l.getChapter().getSubject().getName(), l.getChapter().getId(), l.getChapter().getTitle(),
                        l.getPosition(), done.contains(l.getId())))
                .toList();

        RecommendRequest request = new RecommendRequest(studentId, answerRows, lessonRows, limit);
        RecommendResponse response = ai.recommend(request).orElse(null);
        String source = SOURCE_AI;
        if (response == null) {
            response = FallbackRecommender.recommend(request);
            source = SOURCE_FALLBACK;
        }
        persist(studentId, response, source, catalog);
        return new RecommendationsView(response.subjectMastery(), response.weakTopics(), response.recommendations(),
                response.model(), source, response.generatedAt());
    }

    public SegmentResponse segment(List<SegmentStudent> students) {
        SegmentRequest req = new SegmentRequest(students);
        return ai.segments(req).orElseGet(() -> FallbackRecommender.segments(req));
    }

    /** Topic-level facts for many students (used by teacher analytics). */
    public List<AnswerFact> facts(List<Long> studentIds) {
        return studentIds.isEmpty() ? List.of() : answers.findFactsForStudents(studentIds);
    }

    private void persist(Long studentId, RecommendResponse response, String source, List<Lesson> catalog) {
        recommendations.deleteAllForStudent(studentId);
        Map<Long, Lesson> byId = catalog.stream().collect(Collectors.toMap(Lesson::getId, Function.identity()));
        var student = users.getReferenceById(studentId);
        Instant now = Instant.now();
        for (RecommendationItem item : response.recommendations()) {
            Lesson lesson = byId.get(item.lessonId());
            if (lesson == null) continue;
            Recommendation r = new Recommendation();
            r.setStudent(student);
            r.setLesson(lesson);
            r.setKind(item.kind());
            r.setReason(item.reason().length() > 500 ? item.reason().substring(0, 500) : item.reason());
            r.setPriority(item.priority());
            r.setSource(source);
            r.setCreatedAt(now);
            recommendations.save(r);
        }
    }
}
