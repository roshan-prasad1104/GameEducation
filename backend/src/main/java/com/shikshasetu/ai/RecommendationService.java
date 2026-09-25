package com.shikshasetu.ai;

import com.shikshasetu.ai.AiDtos.*;
import com.shikshasetu.content.ContentText;
import com.shikshasetu.content.Lesson;
import com.shikshasetu.content.LessonRepository;
import com.shikshasetu.content.Subject;
import com.shikshasetu.learning.AnswerFact;
import com.shikshasetu.learning.AttemptAnswerRepository;
import com.shikshasetu.learning.LessonProgressRepository;
import com.shikshasetu.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
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
        return localized(response, source, catalog, lessonRows, answerRows);
    }

    /** Names in the request language plus the facts behind each reason (the model's English text is kept). */
    private static RecommendationsView localized(RecommendResponse response, String source, List<Lesson> catalog,
                                                 List<LessonRow> lessonRows, List<AnswerRow> answerRows) {
        Map<Long, Lesson> lessonById = catalog.stream().collect(Collectors.toMap(Lesson::getId, Function.identity()));
        Map<Long, Subject> subjectById = new HashMap<>();
        catalog.forEach(l -> subjectById.putIfAbsent(l.getChapter().getSubject().getId(), l.getChapter().getSubject()));
        Function<Long, String> subjectName = id ->
                subjectById.containsKey(id) ? ContentText.name(subjectById.get(id)) : null;

        List<SubjectMastery> mastery = response.subjectMastery().stream().map(m -> new SubjectMastery(m.subjectId(),
                Objects.requireNonNullElse(subjectName.apply(m.subjectId()), m.subjectName()), m.mastery(), m.answered())).toList();
        List<WeakTopic> weak = response.weakTopics().stream().map(w -> new WeakTopic(w.topic(), w.subjectId(),
                Objects.requireNonNullElse(subjectName.apply(w.subjectId()), w.subjectName()), w.mastery(), w.answered(),
                w.correct())).toList();

        List<RecommendationView> recs = new ArrayList<>();
        for (RecommendationItem item : response.recommendations()) {
            Lesson lesson = lessonById.get(item.lessonId());
            String title = lesson == null ? item.title() : ContentText.title(lesson);
            String subject = Objects.requireNonNullElse(subjectName.apply(item.subjectId()), item.subjectName());
            String chapter = lesson == null ? item.chapterTitle() : ContentText.title(lesson.getChapter());
            Map<String, Object> params = new HashMap<>();
            params.put("subject", subject);
            params.put("chapter", chapter);
            params.put("lesson", title);
            switch (item.kind()) {
                case "REVISE" -> {
                    long answered = answerRows.stream().filter(a -> a.topic().equals(item.topic())).count();
                    long correct = answerRows.stream().filter(a -> a.topic().equals(item.topic()) && a.correct()).count();
                    double m = weak.stream().filter(w -> w.topic().equals(item.topic())).mapToDouble(WeakTopic::mastery)
                            .findFirst().orElse(answered == 0 ? 0 : (double) correct / answered);
                    params.put("mastery", Math.round(m * 100));
                    params.put("correct", correct);
                    params.put("answered", answered);
                }
                case "CONTINUE" -> {
                    long total = lessonRows.stream().filter(l -> l.subjectId().equals(item.subjectId())).count();
                    long done = lessonRows.stream().filter(l -> l.subjectId().equals(item.subjectId()) && l.completed()).count();
                    params.put("done", done);
                    params.put("total", total);
                    params.put("percent", total == 0 ? 0 : Math.round(100.0 * done / total));
                }
                default -> { }
            }
            recs.add(new RecommendationView(item.lessonId(), title, item.subjectId(), subject, item.chapterId(), chapter,
                    item.topic(), item.kind(), item.priority(), item.reason(), params));
        }
        return new RecommendationsView(mastery, weak, recs, response.model(), source, response.generatedAt());
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
