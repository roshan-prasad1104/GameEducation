package com.shikshasetu.ai;

import com.shikshasetu.ai.AiDtos.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Plain rule-based stand-in used only when the Python service is unavailable, so the
 * app keeps working offline-from-AI. Uses Beta(1,1)-smoothed accuracy without recency
 * weighting — deliberately simpler than the Python model.
 */
final class FallbackRecommender {
    static final String MODEL = "fallback-rules-v1";
    private static final double WEAK_THRESHOLD = 0.6;

    private FallbackRecommender() {}

    static RecommendResponse recommend(RecommendRequest req) {
        Map<Long, String> subjectNames = new LinkedHashMap<>();
        req.lessons().forEach(l -> subjectNames.putIfAbsent(l.subjectId(), l.subjectName()));
        req.answers().forEach(a -> subjectNames.putIfAbsent(a.subjectId(), a.subjectName()));

        Map<Long, int[]> bySubject = new LinkedHashMap<>();
        Map<String, int[]> byTopic = new LinkedHashMap<>();
        Map<String, Long> topicSubject = new HashMap<>();
        for (AnswerRow a : req.answers()) {
            tally(bySubject.computeIfAbsent(a.subjectId(), k -> new int[2]), a.correct());
            tally(byTopic.computeIfAbsent(a.topic(), k -> new int[2]), a.correct());
            topicSubject.put(a.topic(), a.subjectId());
        }

        List<SubjectMastery> subjects = bySubject.entrySet().stream()
                .map(e -> new SubjectMastery(e.getKey(), subjectNames.get(e.getKey()), smoothed(e.getValue()), e.getValue()[1]))
                .sorted(Comparator.comparingDouble(SubjectMastery::mastery))
                .toList();

        List<WeakTopic> weak = byTopic.entrySet().stream()
                .filter(e -> e.getValue()[1] >= 2 && smoothed(e.getValue()) < WEAK_THRESHOLD)
                .map(e -> new WeakTopic(e.getKey(), topicSubject.get(e.getKey()), subjectNames.get(topicSubject.get(e.getKey())),
                        smoothed(e.getValue()), e.getValue()[1], e.getValue()[0]))
                .sorted(Comparator.comparingDouble(WeakTopic::mastery))
                .limit(5)
                .toList();

        List<RecommendationItem> recs = new ArrayList<>();
        Set<Long> used = new HashSet<>();
        for (WeakTopic w : weak) {
            req.lessons().stream().filter(l -> l.topic().equals(w.topic())).findFirst().ifPresent(l -> {
                if (used.add(l.lessonId())) {
                    recs.add(item(l, "REVISE", 1 - w.mastery(), String.format(
                            "You answered %d of %d %s questions correctly. Revisiting this lesson should help.",
                            w.correct(), w.answered(), titleCase(w.topic()))));
                }
            });
        }
        Map<Long, List<LessonRow>> lessonsBySubject = req.lessons().stream()
                .collect(Collectors.groupingBy(LessonRow::subjectId, LinkedHashMap::new, Collectors.toList()));
        for (List<LessonRow> list : lessonsBySubject.values()) {
            boolean started = list.stream().anyMatch(LessonRow::completed);
            list.stream().filter(l -> !l.completed() && !used.contains(l.lessonId())).findFirst().ifPresent(l -> {
                used.add(l.lessonId());
                recs.add(started
                        ? item(l, "CONTINUE", 0.5, "Next up in " + l.subjectName() + ": continue where you left off.")
                        : item(l, "START", 0.3, "You haven't started " + l.subjectName() + " yet — this is a good first lesson."));
            });
        }
        List<RecommendationItem> top = recs.stream()
                .sorted(Comparator.comparingDouble(RecommendationItem::priority).reversed())
                .limit(req.limit())
                .toList();
        return new RecommendResponse(req.studentId(), subjects, weak, top, MODEL, Instant.now());
    }

    static SegmentResponse segments(SegmentRequest req) {
        List<Segment> out = req.students().stream().map(s -> {
            if (s.quizAttempts() == 0) return new Segment(s.studentId(), "NEEDS_SUPPORT", null, "No quiz attempts yet");
            if (s.avgScore() < 50) return new Segment(s.studentId(), "NEEDS_SUPPORT", null,
                    String.format("Average quiz score %.0f%% is below 50%%", s.avgScore()));
            if (s.avgScore() >= 80) return new Segment(s.studentId(), "ADVANCED", null,
                    String.format("Average quiz score %.0f%%", s.avgScore()));
            return new Segment(s.studentId(), "ON_TRACK", null, String.format("Average quiz score %.0f%%", s.avgScore()));
        }).toList();
        return new SegmentResponse(out, "fallback-rules", List.of());
    }

    private static void tally(int[] counts, boolean correct) {
        if (correct) counts[0]++;
        counts[1]++;
    }

    private static double smoothed(int[] counts) {
        return (counts[0] + 1.0) / (counts[1] + 2.0);
    }

    private static RecommendationItem item(LessonRow l, String kind, double priority, String reason) {
        return new RecommendationItem(l.lessonId(), l.title(), l.subjectId(), l.subjectName(), l.chapterId(),
                l.chapterTitle(), l.topic(), kind, Math.round(priority * 100) / 100.0, reason);
    }

    static String titleCase(String slug) {
        return Arrays.stream(slug.split("-"))
                .map(w -> w.isEmpty() ? w : Character.toUpperCase(w.charAt(0)) + w.substring(1))
                .collect(Collectors.joining(" "));
    }
}
