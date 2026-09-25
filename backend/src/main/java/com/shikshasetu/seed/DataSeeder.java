package com.shikshasetu.seed;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shikshasetu.common.AppProperties;
import com.shikshasetu.common.TimeService;
import com.shikshasetu.content.*;
import com.shikshasetu.gamification.GamificationService;
import com.shikshasetu.learning.LearningDtos.AnswerInput;
import com.shikshasetu.learning.LearningDtos.SubmitQuizRequest;
import com.shikshasetu.learning.LearningService;
import com.shikshasetu.seed.ContentSeed.*;
import com.shikshasetu.teacher.Assignment;
import com.shikshasetu.teacher.AssignmentRepository;
import com.shikshasetu.user.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;

/**
 * Seeds the curriculum, demo accounts and a realistic two-week learning history on the
 * first start (when the users table is empty). History is replayed through
 * {@link LearningService}, so XP, badges, streaks and missions are all computed by the
 * real game rules rather than hard-coded.
 *
 * DEVELOPMENT DATA ONLY — the demo passwords below are documented in README.md.
 * Disable with SEED_ENABLED=false for any real deployment.
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {
    private final AppProperties props;
    private final UserRepository users;
    private final StudentProfileRepository profiles;
    private final SubjectRepository subjects;
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final AssignmentRepository assignments;
    private final LearningService learning;
    private final GamificationService gamification;
    private final PasswordEncoder encoder;
    private final TransactionTemplate tx;
    private final TimeService time;

    /** A simulated classmate: base accuracy, per-subject/topic adjustments and which days they studied. */
    private record Persona(String name, String email, int grade, double skill, Map<String, Double> adjust,
                           int[] daysAgo, int lessonsPerDay, List<String> subjectOrder) {}

    @Override
    public void run(ApplicationArguments args) throws IOException {
        gamification.ensureBadgeCatalogue();
        if (!props.seed().enabled() || users.count() > 0) return;

        log.info("Seeding demo content and accounts...");
        tx.executeWithoutResult(s -> {
            try {
                seedContent();
            } catch (IOException e) {
                throw new IllegalStateException("Could not read seed/content.json", e);
            }
        });
        Long teacherId = tx.execute(s -> seedStaff());

        List<Persona> personas = List.of(
                // The demo student: strong in science, weak in linear equations → AI recommends revising algebra.
                new Persona("Aarav Sharma", "aarav@shiksha.org", 8, 0.75,
                        Map.of("math", -0.25, "linear-equations", -0.25, "physics", 0.15, "biology", 0.1),
                        new int[]{9, 6, 5, 4, 3, 2, 1}, 2, List.of("math", "physics", "biology", "chemistry", "cs")),
                new Persona("Priya Sahoo", "priya@shiksha.org", 8, 0.92, Map.of(),
                        new int[]{12, 11, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0}, 2, List.of("physics", "math", "chemistry", "biology", "cs")),
                new Persona("Rohan Patel", "rohan@shiksha.org", 8, 0.72, Map.of("chemistry", -0.2),
                        new int[]{10, 8, 6, 4, 2, 1}, 2, List.of("math", "chemistry", "physics", "cs", "biology")),
                new Persona("Kavya Mahato", "kavya@shiksha.org", 8, 0.42, Map.of("math", -0.1),
                        new int[]{11, 7}, 2, List.of("math", "biology", "physics", "chemistry", "cs")),
                new Persona("Manish Bag", "manish@shiksha.org", 8, 0.63, Map.of("physics", -0.15),
                        new int[]{9, 5, 3, 0}, 2, List.of("physics", "cs", "math", "biology", "chemistry")),
                new Persona("Ananya Das", "ananya@shiksha.org", 8, 0.86, Map.of(),
                        new int[]{13, 12, 9, 7, 5, 3, 1}, 2, List.of("biology", "chemistry", "math", "physics", "cs")),
                new Persona("Imran Khan", "imran@shiksha.org", 8, 0.5, Map.of("cs", 0.25),
                        new int[]{12, 4}, 3, List.of("cs", "math", "physics", "biology", "chemistry")),
                new Persona("Deepa Oraon", "deepa@shiksha.org", 8, 0.6, Map.of(),
                        new int[]{2}, 1, List.of("biology", "math", "physics", "chemistry", "cs")));

        Random rng = new Random(42);
        for (Persona p : personas) {
            Long studentId = tx.execute(s -> createStudent(p, teacherId));
            replayHistory(p, studentId, rng);
        }
        tx.executeWithoutResult(s -> seedAssignments(teacherId));
        log.info("Seeding complete: {} users, {} lessons, {} quizzes.", users.count(), lessons.count(), quizzes.count());
    }

    private void seedContent() throws IOException {
        ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        ContentSeed seed;
        try (InputStream in = new ClassPathResource("seed/content.json").getInputStream()) {
            seed = mapper.readValue(in, ContentSeed.class);
        }
        for (SubjectSeed ss : seed.subjects()) {
            Subject subject = new Subject();
            subject.setCode(ss.code());
            subject.setName(ss.name());
            subject.setDescription(ss.description());
            subject.setColor(ss.color());
            subject.setIcon(ss.icon());
            subject.setGradeLevel(ss.gradeLevel());
            int cPos = 1;
            for (ChapterSeed cs : ss.chapters()) {
                Chapter chapter = new Chapter();
                chapter.setSubject(subject);
                chapter.setTitle(cs.title());
                chapter.setDescription(cs.description());
                chapter.setPosition(cPos++);
                int lPos = 1;
                for (LessonSeed ls : cs.lessons()) {
                    Lesson lesson = new Lesson();
                    lesson.setChapter(chapter);
                    lesson.setTitle(ls.title());
                    lesson.setTopic(ls.topic());
                    lesson.setSummary(ls.summary());
                    lesson.setContent(ls.content());
                    lesson.setVideoUrl(ls.videoUrl());
                    lesson.setDurationMinutes(ls.durationMinutes());
                    lesson.setPosition(lPos++);
                    chapter.getLessons().add(lesson);
                }
                if (cs.quiz() != null) {
                    Quiz quiz = new Quiz();
                    quiz.setChapter(chapter);
                    quiz.setTitle(cs.quiz().title());
                    quiz.setDescription(cs.quiz().description());
                    quiz.setTimeLimitSeconds(cs.quiz().timeLimitSeconds());
                    int qPos = 1;
                    for (QuestionSeed qs : cs.quiz().questions()) {
                        Question q = new Question();
                        q.setQuiz(quiz);
                        q.setPrompt(qs.prompt());
                        q.setOptions(new ArrayList<>(qs.options()));
                        q.setCorrectIndex(qs.correctIndex());
                        q.setExplanation(qs.explanation());
                        q.setTopic(qs.topic());
                        q.setPosition(qPos++);
                        quiz.getQuestions().add(q);
                    }
                    chapter.getQuizzes().add(quiz);
                }
                subject.getChapters().add(chapter);
            }
            subjects.save(subject);
        }
    }

    private Long seedStaff() {
        User admin = new User("Ravi Mahapatra", "admin@shiksha.org", encoder.encode("Admin@123"), Role.ADMIN);
        users.save(admin);
        User teacher = new User("Sunita Kullu", "teacher@shiksha.org", encoder.encode("Teacher@123"), Role.TEACHER);
        return users.save(teacher).getId();
    }

    private Long createStudent(Persona p, Long teacherId) {
        User u = new User(p.name(), p.email(), encoder.encode("Student@123"), Role.STUDENT);
        users.save(u);
        StudentProfile profile = new StudentProfile(u);
        profile.setGradeLevel(p.grade());
        profile.setSchool("Govt. High School, Sundargarh");
        profile.setDistrict("Sundargarh, Odisha");
        profile.setOnboarded(true);
        profile.setTeacher(users.getReferenceById(teacherId));
        profiles.save(profile);
        return u.getId();
    }

    /** One lesson in a persona's study queue; the chapter quiz follows the chapter's last lesson. */
    private record QueueItem(Long lessonId, boolean lastInChapter, Long quizId, String subjectCode) {}

    private record SeedQuestion(Long id, int correct, int optionCount, String topic) {}

    /** Studies lessons in the persona's subject order and takes each chapter quiz once its lessons are done. */
    private void replayHistory(Persona p, Long studentId, Random rng) {
        List<QueueItem> queue = tx.execute(s -> {
            List<QueueItem> items = new ArrayList<>();
            for (String code : p.subjectOrder()) {
                Subject subject = subjects.findByCode(code).orElseThrow();
                for (Chapter c : subject.getChapters()) {
                    List<Lesson> ls = c.getLessons();
                    Long quizId = c.getQuizzes().isEmpty() ? null : c.getQuizzes().getFirst().getId();
                    for (int i = 0; i < ls.size(); i++) {
                        items.add(new QueueItem(ls.get(i).getId(), i == ls.size() - 1, quizId, code));
                    }
                }
            }
            return items;
        });

        Iterator<QueueItem> it = queue.iterator();
        int[] days = p.daysAgo().clone();
        Arrays.sort(days);
        for (int d = days.length - 1; d >= 0; d--) {
            LocalDate date = time.today().minusDays(days[d]);
            Instant at = time.startOf(date).plusSeconds(LocalTime.of(16, 30).toSecondOfDay());
            for (int k = 0; k < p.lessonsPerDay() && it.hasNext(); k++) {
                QueueItem item = it.next();
                at = at.plusSeconds(20 * 60);
                learning.recordLessonCompletion(studentId, item.lessonId(), at, false);
                if (item.lastInChapter() && item.quizId() != null) {
                    at = at.plusSeconds(10 * 60);
                    learning.gradeAttempt(studentId, item.quizId(),
                            new SubmitQuizRequest(answerQuiz(p, item, rng), 180 + rng.nextInt(120), null, null, false),
                            at, false);
                }
            }
        }
    }

    /** Picks the right answer with the persona's (subject/topic-adjusted) probability, otherwise a wrong one. */
    private List<AnswerInput> answerQuiz(Persona p, QueueItem item, Random rng) {
        List<SeedQuestion> questions = tx.execute(s -> quizzes.findById(item.quizId()).orElseThrow().getQuestions().stream()
                .map(q -> new SeedQuestion(q.getId(), q.getCorrectIndex(), q.getOptions().size(), q.getTopic())).toList());
        List<AnswerInput> answers = new ArrayList<>();
        for (SeedQuestion q : questions) {
            double pCorrect = p.skill() + p.adjust().getOrDefault(item.subjectCode(), 0.0) + p.adjust().getOrDefault(q.topic(), 0.0);
            pCorrect = Math.max(0.05, Math.min(0.98, pCorrect));
            int choice = rng.nextDouble() < pCorrect ? q.correct()
                    : (q.correct() + 1 + rng.nextInt(q.optionCount() - 1)) % q.optionCount();
            answers.add(new AnswerInput(q.id(), choice));
        }
        return answers;
    }

    private void seedAssignments(Long teacherId) {
        User teacher = users.getReferenceById(teacherId);
        Lesson algebra = lessons.findAllInCurriculumOrder().stream()
                .filter(l -> l.getTopic().equals("linear-equations")).findFirst().orElse(null);
        if (algebra != null) {
            Assignment a = new Assignment();
            a.setTeacher(teacher);
            a.setLesson(algebra);
            a.setTitle("Revise: " + algebra.getTitle());
            a.setNote("Many of you found linear equations tricky. Re-read this before Friday.");
            a.setDueDate(time.today().plusDays(3));
            a.setCreatedAt(Instant.now());
            assignments.save(a);
        }
        Quiz physicsQuiz = quizzes.findAllWithChapter().stream()
                .filter(q -> q.getChapter().getSubject().getCode().equals("physics")).findFirst().orElse(null);
        if (physicsQuiz != null) {
            Assignment a = new Assignment();
            a.setTeacher(teacher);
            a.setQuiz(physicsQuiz);
            a.setTitle("Practice: " + physicsQuiz.getTitle());
            a.setDueDate(time.today().plusDays(5));
            a.setCreatedAt(Instant.now());
            assignments.save(a);
        }
    }
}
