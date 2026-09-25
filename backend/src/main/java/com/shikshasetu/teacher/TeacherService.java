package com.shikshasetu.teacher;

import com.shikshasetu.ai.AiDtos.Segment;
import com.shikshasetu.ai.AiDtos.SegmentResponse;
import com.shikshasetu.ai.AiDtos.SegmentStudent;
import com.shikshasetu.ai.RecommendationService;
import com.shikshasetu.common.ApiException;
import com.shikshasetu.common.TimeService;
import com.shikshasetu.content.*;
import com.shikshasetu.gamification.GamificationService;
import com.shikshasetu.gamification.Levels;
import com.shikshasetu.learning.*;
import com.shikshasetu.security.AuthUser;
import com.shikshasetu.student.StudentDtos.ActivityItem;
import com.shikshasetu.student.StudentDtos.SubjectProgress;
import com.shikshasetu.teacher.TeacherDtos.*;
import com.shikshasetu.user.Role;
import com.shikshasetu.user.StudentProfile;
import com.shikshasetu.user.StudentProfileRepository;
import com.shikshasetu.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/** Class analytics computed from real attempts and lesson progress of the teacher's students. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherService {
    private static final double WEAK_THRESHOLD = 0.6;

    private final StudentProfileRepository profiles;
    private final UserRepository users;
    private final LessonProgressRepository progressRepo;
    private final QuizAttemptRepository attemptRepo;
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final SubjectRepository subjects;
    private final AssignmentRepository assignments;
    private final RecommendationService ai;
    private final GamificationService gamification;
    private final CatalogService catalog;
    private final LearningService learning;
    private final TimeService time;

    /** All raw data for one teacher's class, loaded once per request. */
    private record ClassData(List<StudentProfile> roster, Map<Long, List<LessonProgress>> progress,
                             Map<Long, List<QuizAttempt>> attempts, List<AnswerFact> facts) {}

    private ClassData load(Long teacherId) {
        List<StudentProfile> roster = profiles.findActiveByTeacherId(teacherId);
        List<Long> ids = roster.stream().map(p -> p.getUser().getId()).toList();
        if (ids.isEmpty()) return new ClassData(roster, Map.of(), Map.of(), List.of());
        Map<Long, List<LessonProgress>> progress = progressRepo.findByStudentIdIn(ids).stream()
                .collect(Collectors.groupingBy(lp -> lp.getStudent().getId()));
        Map<Long, List<QuizAttempt>> attempts = attemptRepo.findByStudentIdIn(ids).stream()
                .collect(Collectors.groupingBy(a -> a.getStudent().getId()));
        return new ClassData(roster, progress, attempts, ai.facts(ids));
    }

    /** Student rows plus the name of the model that segmented them. */
    private record Rows(List<StudentRow> list, String model) {}

    public List<StudentRow> students(Long teacherId) {
        return rows(load(teacherId)).list();
    }

    private Rows rows(ClassData d) {
        LocalDate since = time.today().minusDays(29);
        List<SegmentStudent> features = new ArrayList<>();
        Map<Long, int[]> stats = new HashMap<>();
        for (StudentProfile p : d.roster()) {
            Long id = p.getUser().getId();
            List<LessonProgress> lp = d.progress().getOrDefault(id, List.of());
            List<QuizAttempt> qa = d.attempts().getOrDefault(id, List.of());
            Set<LocalDate> days = new HashSet<>();
            lp.forEach(x -> days.add(time.dateOf(x.getCompletedAt())));
            qa.forEach(x -> days.add(time.dateOf(x.getSubmittedAt())));
            int activeDays = (int) days.stream().filter(day -> !day.isBefore(since)).count();
            double avg = qa.stream().mapToInt(QuizAttempt::getPercentage).average().orElse(0);
            features.add(new SegmentStudent(id, p.getUser().getName(), avg, lp.size(), qa.size(), activeDays));
            stats.put(id, new int[]{lp.size(), qa.size(), activeDays});
        }
        SegmentResponse seg = features.isEmpty() ? null : ai.segment(features);
        Map<Long, Segment> segById = seg == null ? Map.of()
                : seg.segments().stream().collect(Collectors.toMap(Segment::studentId, s -> s, (a, b) -> a));
        Map<Long, List<AnswerFact>> factsByStudent = d.facts().stream().collect(Collectors.groupingBy(AnswerFact::studentId));

        List<StudentRow> rows = new ArrayList<>();
        for (StudentProfile p : d.roster()) {
            Long id = p.getUser().getId();
            List<QuizAttempt> qa = d.attempts().getOrDefault(id, List.of());
            Integer avg = qa.isEmpty() ? null : (int) Math.round(qa.stream().mapToInt(QuizAttempt::getPercentage).average().orElse(0));
            Segment s = segById.get(id);
            List<TopicStat> topics = topicStats(factsByStudent.getOrDefault(id, List.of()), 1);
            String weakest = topics.stream().filter(t -> t.answered() >= 2 && t.accuracy() < 60)
                    .map(TopicStat::topicName).findFirst().orElse(null);
            int[] st = stats.get(id);
            rows.add(new StudentRow(id, p.getUser().getName(), p.getUser().getEmail(), p.getGradeLevel(), p.getXp(),
                    Levels.levelFor(p.getXp()), gamification.effectiveStreak(p), st[0], st[1], avg,
                    p.getLastActiveDate(), st[2], s == null ? "ON_TRACK" : s.segment(), s == null ? null : s.reason(),
                    weakest));
        }
        return new Rows(rows, seg == null ? "none" : seg.model());
    }

    public Overview overview(Long teacherId) {
        ClassData d = load(teacherId);
        Rows classRows = rows(d);
        List<StudentRow> rows = classRows.list();
        LocalDate today = time.today();
        LocalDate weekAgo = today.minusDays(6);
        List<QuizAttempt> allAttempts = d.attempts().values().stream().flatMap(List::stream).toList();
        List<LessonProgress> allProgress = d.progress().values().stream().flatMap(List::stream).toList();

        int active = (int) rows.stream().filter(r -> r.lastActive() != null && !r.lastActive().isBefore(weekAgo)).count();
        Integer avg = allAttempts.isEmpty() ? null
                : (int) Math.round(allAttempts.stream().mapToInt(QuizAttempt::getPercentage).average().orElse(0));

        int[] buckets = new int[4];
        for (QuizAttempt a : allAttempts) {
            int pct = a.getPercentage();
            buckets[pct < 40 ? 0 : pct < 60 ? 1 : pct < 80 ? 2 : 3]++;
        }
        List<Bucket> distribution = List.of(new Bucket("0–39%", buckets[0]), new Bucket("40–59%", buckets[1]),
                new Bucket("60–79%", buckets[2]), new Bucket("80–100%", buckets[3]));

        Map<String, Long> segCounts = rows.stream().collect(Collectors.groupingBy(StudentRow::segment, Collectors.counting()));
        List<Bucket> segments = List.of("NEEDS_SUPPORT", "ON_TRACK", "ADVANCED").stream()
                .map(s -> new Bucket(s, segCounts.getOrDefault(s, 0L).intValue())).toList();

        List<SubjectPerformance> perf = new ArrayList<>();
        for (Subject s : subjects.findAllByOrderByIdAsc()) {
            List<Integer> scores = allAttempts.stream()
                    .filter(a -> a.getQuiz().getChapter().getSubject().getId().equals(s.getId()))
                    .map(QuizAttempt::getPercentage).toList();
            long subjectLessons = lessons.countBySubjectId(s.getId());
            long completions = allProgress.stream()
                    .filter(lp -> lp.getLesson().getChapter().getSubject().getId().equals(s.getId())).count();
            int completion = subjectLessons == 0 || rows.isEmpty() ? 0
                    : (int) Math.round(100.0 * completions / (subjectLessons * rows.size()));
            perf.add(new SubjectPerformance(s.getId(), ContentText.name(s), s.getColor(),
                    scores.isEmpty() ? null : (int) Math.round(scores.stream().mapToInt(i -> i).average().orElse(0)),
                    scores.size(), completion));
        }

        List<DayPoint> activity = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            activity.add(new DayPoint(day,
                    (int) allProgress.stream().filter(x -> time.dateOf(x.getCompletedAt()).equals(day)).count(),
                    (int) allAttempts.stream().filter(x -> time.dateOf(x.getSubmittedAt()).equals(day)).count()));
        }

        Map<Long, String> names = d.roster().stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), p -> p.getUser().getName()));
        List<TeacherActivity> recent = new ArrayList<>();
        allProgress.forEach(lp -> recent.add(new TeacherActivity(names.get(lp.getStudent().getId()),
                new ActivityItem("LESSON", "Completed " + ContentText.title(lp.getLesson()),
                        ContentText.name(lp.getLesson().getChapter().getSubject()), lp.getCompletedAt()))));
        allAttempts.forEach(a -> recent.add(new TeacherActivity(names.get(a.getStudent().getId()),
                new ActivityItem("QUIZ", ContentText.title(a.getQuiz()), "Scored " + a.getPercentage() + "%", a.getSubmittedAt()))));
        recent.sort(Comparator.comparing((TeacherActivity t) -> t.item().at()).reversed());

        return new Overview(rows.size(), active, avg, allProgress.size(), allAttempts.size(),
                segCounts.getOrDefault("NEEDS_SUPPORT", 0L).intValue(), classRows.model(), distribution, segments,
                perf, activity, weakTopics(d).stream().limit(6).toList(), recent.stream().limit(10).toList());
    }

    public List<TopicStat> weakTopics(Long teacherId) {
        return weakTopics(load(teacherId));
    }

    private List<TopicStat> weakTopics(ClassData d) {
        return topicStats(d.facts(), 2).stream().filter(t -> t.accuracy() < 70).toList();
    }

    /** Aggregates answers per topic, sorted weakest first, and links each topic to its lesson. */
    private List<TopicStat> topicStats(List<AnswerFact> facts, int minAnswered) {
        Map<String, Lesson> lessonByTopic = new HashMap<>();
        lessons.findAllInCurriculumOrder().forEach(l -> lessonByTopic.putIfAbsent(l.getTopic(), l));
        Map<String, List<AnswerFact>> byTopic = facts.stream().collect(Collectors.groupingBy(AnswerFact::topic));
        List<TopicStat> out = new ArrayList<>();
        byTopic.forEach((topic, list) -> {
            if (list.size() < minAnswered) return;
            int correct = (int) list.stream().filter(AnswerFact::correct).count();
            Map<Long, List<AnswerFact>> perStudent = list.stream().collect(Collectors.groupingBy(AnswerFact::studentId));
            int struggling = (int) perStudent.values().stream().filter(sl -> sl.size() >= 2
                    && (sl.stream().filter(AnswerFact::correct).count() + 1.0) / (sl.size() + 2.0) < WEAK_THRESHOLD).count();
            Lesson lesson = lessonByTopic.get(topic);
            AnswerFact first = list.getFirst();
            out.add(new TopicStat(topic, titleCase(topic), first.subjectId(), first.subjectName(), list.size(), correct,
                    (int) Math.round(100.0 * correct / list.size()), struggling,
                    lesson == null ? null : lesson.getId(), lesson == null ? null : ContentText.title(lesson)));
        });
        out.sort(Comparator.comparingInt(TopicStat::accuracy).thenComparing(TopicStat::answered, Comparator.reverseOrder()));
        return out;
    }

    public StudentDetail student(Long teacherId, Long studentId) {
        StudentProfile p = ownStudent(teacherId, studentId);
        ClassData d = load(teacherId);
        StudentRow row = rows(d).list().stream().filter(r -> r.id().equals(studentId)).findFirst()
                .orElseThrow(() -> ApiException.notFound("Student"));
        AuthUser asStudent = new AuthUser(studentId, p.getUser().getEmail(), p.getUser().getName(), Role.STUDENT);
        Map<Long, List<Integer>> scoresBySubject = new HashMap<>();
        d.attempts().getOrDefault(studentId, List.of()).forEach(a -> scoresBySubject
                .computeIfAbsent(a.getQuiz().getChapter().getSubject().getId(), k -> new ArrayList<>()).add(a.getPercentage()));
        List<SubjectProgress> subjectProgress = catalog.listSubjects(asStudent).stream().map(s -> {
            List<Integer> sc = scoresBySubject.get(s.id());
            return new SubjectProgress(s, List.of(),
                    sc == null ? null : (int) Math.round(sc.stream().mapToInt(i -> i).average().orElse(0)));
        }).toList();
        List<AnswerFact> facts = d.facts().stream().filter(f -> f.studentId().equals(studentId)).toList();
        return new StudentDetail(row, subjectProgress, learning.attempts(studentId), topicStats(facts, 1));
    }

    // ------------------------------------------------------------------ assignments

    public List<AssignmentView> assignments(Long teacherId) {
        ClassData d = load(teacherId);
        int classSize = d.roster().size();
        return assignments.findByTeacherIdOrderByCreatedAtDesc(teacherId).stream().map(a -> {
            List<Long> targets = a.getStudent() != null ? List.of(a.getStudent().getId())
                    : d.roster().stream().map(p -> p.getUser().getId()).toList();
            int done = (int) targets.stream().filter(sid -> isDone(a, d, sid)).count();
            return view(a, done, a.getStudent() != null ? 1 : classSize);
        }).toList();
    }

    @Transactional
    public AssignmentView createAssignment(AuthUser teacher, CreateAssignmentRequest req) {
        if ((req.lessonId() == null) == (req.quizId() == null)) {
            throw ApiException.badRequest("Choose exactly one lesson or one quiz.");
        }
        if (req.dueDate() != null && req.dueDate().isBefore(time.today())) {
            throw ApiException.badRequest("Due date cannot be in the past.");
        }
        Assignment a = new Assignment();
        a.setTeacher(users.getReferenceById(teacher.id()));
        a.setTitle(req.title().trim());
        a.setNote(req.note());
        a.setDueDate(req.dueDate());
        a.setCreatedAt(Instant.now());
        if (req.lessonId() != null) a.setLesson(lessons.findById(req.lessonId()).orElseThrow(() -> ApiException.notFound("Lesson")));
        if (req.quizId() != null) a.setQuiz(quizzes.findById(req.quizId()).orElseThrow(() -> ApiException.notFound("Quiz")));
        if (req.studentId() != null) a.setStudent(ownStudent(teacher.id(), req.studentId()).getUser());
        assignments.save(a);
        int target = a.getStudent() != null ? 1 : profiles.findActiveByTeacherId(teacher.id()).size();
        return view(a, 0, target);
    }

    @Transactional
    public void deleteAssignment(Long teacherId, Long id) {
        Assignment a = assignments.findById(id).filter(x -> x.getTeacher().getId().equals(teacherId))
                .orElseThrow(() -> ApiException.notFound("Assignment"));
        assignments.delete(a);
    }

    private boolean isDone(Assignment a, ClassData d, Long studentId) {
        if (a.getLesson() != null) {
            return d.progress().getOrDefault(studentId, List.of()).stream()
                    .anyMatch(lp -> lp.getLesson().getId().equals(a.getLesson().getId()));
        }
        return d.attempts().getOrDefault(studentId, List.of()).stream()
                .anyMatch(q -> q.getQuiz().getId().equals(a.getQuiz().getId()) && !q.getSubmittedAt().isBefore(a.getCreatedAt()));
    }

    private static AssignmentView view(Assignment a, int done, int target) {
        Long chapterId = a.getLesson() != null ? a.getLesson().getChapter().getId() : a.getQuiz().getChapter().getId();
        return new AssignmentView(a.getId(), a.getTitle(), a.getNote(), a.getDueDate(),
                a.getLesson() == null ? null : a.getLesson().getId(), a.getLesson() == null ? null : ContentText.title(a.getLesson()),
                a.getQuiz() == null ? null : a.getQuiz().getId(), a.getQuiz() == null ? null : ContentText.title(a.getQuiz()),
                chapterId, null, a.getStudent() == null ? null : a.getStudent().getId(),
                a.getStudent() == null ? null : a.getStudent().getName(), a.getCreatedAt(), null, done, target);
    }

    private StudentProfile ownStudent(Long teacherId, Long studentId) {
        return profiles.findByUserId(studentId)
                .filter(p -> p.getTeacher() != null && p.getTeacher().getId().equals(teacherId))
                .orElseThrow(() -> ApiException.notFound("Student"));
    }

    private static String titleCase(String slug) {
        return Arrays.stream(slug.split("-"))
                .map(w -> w.isEmpty() ? w : Character.toUpperCase(w.charAt(0)) + w.substring(1))
                .collect(Collectors.joining(" "));
    }
}
