package com.shikshasetu.student;

import com.shikshasetu.common.ApiException;
import com.shikshasetu.common.TimeService;
import com.shikshasetu.content.CatalogDtos.SubjectCard;
import com.shikshasetu.content.CatalogService;
import com.shikshasetu.content.Chapter;
import com.shikshasetu.content.Lesson;
import com.shikshasetu.content.LessonRepository;
import com.shikshasetu.gamification.GamificationDtos.BadgeView;
import com.shikshasetu.gamification.GamificationService;
import com.shikshasetu.gamification.Levels;
import com.shikshasetu.gamification.StudentBadgeRepository;
import com.shikshasetu.gamification.XpTransactionRepository;
import com.shikshasetu.learning.LearningService;
import com.shikshasetu.learning.LessonProgress;
import com.shikshasetu.learning.LessonProgressRepository;
import com.shikshasetu.learning.QuizAttempt;
import com.shikshasetu.learning.QuizAttemptRepository;
import com.shikshasetu.security.AuthUser;
import com.shikshasetu.student.StudentDtos.*;
import com.shikshasetu.teacher.Assignment;
import com.shikshasetu.teacher.AssignmentRepository;
import com.shikshasetu.teacher.AssignmentView;
import com.shikshasetu.user.StudentProfile;
import com.shikshasetu.user.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

/** Read models for the student dashboard and progress pages. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentService {
    private final StudentProfileRepository profiles;
    private final CatalogService catalog;
    private final LessonRepository lessons;
    private final LessonProgressRepository progress;
    private final QuizAttemptRepository attempts;
    private final StudentBadgeRepository studentBadges;
    private final XpTransactionRepository xp;
    private final AssignmentRepository assignments;
    private final GamificationService gamification;
    private final LearningService learning;
    private final TimeService time;

    public Dashboard dashboard(AuthUser user) {
        StudentProfile p = profile(user.id());
        List<SubjectCard> subjects = catalog.listSubjects(user);
        List<LessonProgress> done = progress.findByStudentIdOrderByCompletedAtDesc(user.id());
        List<QuizAttempt> quizAttempts = attempts.findByStudentIdOrderBySubmittedAtDesc(user.id());
        List<BadgeView> badges = gamification.badgesFor(user.id());
        List<BadgeView> earned = badges.stream().filter(BadgeView::earned)
                .sorted(Comparator.comparing(BadgeView::earnedAt).reversed()).toList();

        long totalLessons = subjects.stream().mapToLong(SubjectCard::lessonCount).sum();
        int avg = (int) Math.round(quizAttempts.stream().mapToInt(QuizAttempt::getPercentage).average().orElse(0));
        LocalDate monday = time.today().with(DayOfWeek.MONDAY);

        return new Dashboard(p.getUser().getName(), p.getGradeLevel(), p.getSchool(), Levels.info(p.getXp()),
                gamification.effectiveStreak(p), p.getLongestStreak(), xp.sumSince(user.id(), time.startOf(monday)),
                done.size(), totalLessons, quizAttempts.size(), avg, subjects, continueLesson(done),
                gamification.missionsFor(user.id(), time.today()), assignmentsFor(p), earned.stream().limit(3).toList(),
                earned.size(), badges.size(), recentActivity(done, quizAttempts, earned));
    }

    public ProgressView progress(AuthUser user) {
        List<QuizAttempt> quizAttempts = attempts.findByStudentIdOrderBySubmittedAtDesc(user.id());
        Map<Long, List<Integer>> scoresBySubject = new HashMap<>();
        for (QuizAttempt a : quizAttempts) {
            scoresBySubject.computeIfAbsent(a.getQuiz().getChapter().getSubject().getId(), k -> new ArrayList<>())
                    .add(a.getPercentage());
        }
        List<SubjectProgress> subjects = catalog.listSubjects(user).stream().map(s -> {
            List<Integer> scores = scoresBySubject.get(s.id());
            Integer avg = scores == null ? null : (int) Math.round(scores.stream().mapToInt(i -> i).average().orElse(0));
            return new SubjectProgress(s, catalog.subject(s.id(), user).chapters(), avg);
        }).toList();

        LocalDate today = time.today();
        List<LessonProgress> done = progress.findByStudentIdOrderByCompletedAtDesc(user.id());
        List<DayActivity> week = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            int l = (int) done.stream().filter(x -> time.dateOf(x.getCompletedAt()).equals(d)).count();
            int q = (int) quizAttempts.stream().filter(x -> time.dateOf(x.getSubmittedAt()).equals(d)).count();
            week.add(new DayActivity(d, l, q));
        }
        return new ProgressView(subjects, learning.attempts(user.id()), week);
    }

    public List<AssignmentView> assignments(Long studentId) {
        return assignmentsFor(profile(studentId));
    }

    // ------------------------------------------------------------------ helpers

    private StudentProfile profile(Long userId) {
        return profiles.findByUserId(userId).orElseThrow(() -> ApiException.notFound("Student profile"));
    }

    /** The next unfinished lesson after the most recently completed one, else the very first lesson. */
    private LessonPointer continueLesson(List<LessonProgress> done) {
        Set<Long> doneIds = new HashSet<>();
        done.forEach(d -> doneIds.add(d.getLesson().getId()));
        List<Lesson> ordered = lessons.findAllInCurriculumOrder();
        if (ordered.isEmpty()) return null;
        int start = 0;
        if (!done.isEmpty()) {
            Long lastId = done.getFirst().getLesson().getId();
            for (int i = 0; i < ordered.size(); i++) if (ordered.get(i).getId().equals(lastId)) start = i;
        }
        for (int i = 0; i < ordered.size(); i++) {
            Lesson l = ordered.get((start + i) % ordered.size());
            if (!doneIds.contains(l.getId())) return pointer(l);
        }
        return null; // everything completed
    }

    private static LessonPointer pointer(Lesson l) {
        Chapter c = l.getChapter();
        return new LessonPointer(l.getId(), l.getTitle(), c.getId(), c.getTitle(), c.getSubject().getId(),
                c.getSubject().getName(), c.getSubject().getColor());
    }

    private List<ActivityItem> recentActivity(List<LessonProgress> done, List<QuizAttempt> quizAttempts,
                                              List<BadgeView> earned) {
        List<ActivityItem> items = new ArrayList<>();
        done.stream().limit(6).forEach(d -> items.add(new ActivityItem("LESSON", "Completed " + d.getLesson().getTitle(),
                d.getLesson().getChapter().getSubject().getName(), d.getCompletedAt())));
        quizAttempts.stream().limit(6).forEach(a -> items.add(new ActivityItem("QUIZ", a.getQuiz().getTitle(),
                "Scored " + a.getPercentage() + "% · +" + a.getXpEarned() + " XP", a.getSubmittedAt())));
        earned.stream().limit(6).forEach(b -> items.add(new ActivityItem("BADGE", "Unlocked " + b.name(),
                b.description(), b.earnedAt())));
        items.sort(Comparator.comparing(ActivityItem::at).reversed());
        return items.stream().limit(8).toList();
    }

    private List<AssignmentView> assignmentsFor(StudentProfile p) {
        if (p.getTeacher() == null) return List.of();
        Long sid = p.getUser().getId();
        Set<Long> doneLessons = progress.findCompletedLessonIds(sid);
        List<QuizAttempt> quizAttempts = attempts.findByStudentIdOrderBySubmittedAtDesc(sid);
        List<AssignmentView> out = new ArrayList<>();
        for (Assignment a : assignments.findForStudent(p.getTeacher().getId(), sid)) {
            boolean completed = a.getLesson() != null
                    ? doneLessons.contains(a.getLesson().getId())
                    : quizAttempts.stream().anyMatch(q -> q.getQuiz().getId().equals(a.getQuiz().getId())
                    && !q.getSubmittedAt().isBefore(a.getCreatedAt()));
            Long chapterId = a.getLesson() != null ? a.getLesson().getChapter().getId() : a.getQuiz().getChapter().getId();
            out.add(new AssignmentView(a.getId(), a.getTitle(), a.getNote(), a.getDueDate(),
                    a.getLesson() == null ? null : a.getLesson().getId(),
                    a.getLesson() == null ? null : a.getLesson().getTitle(),
                    a.getQuiz() == null ? null : a.getQuiz().getId(),
                    a.getQuiz() == null ? null : a.getQuiz().getTitle(), chapterId,
                    a.getTeacher().getName(), null, null, a.getCreatedAt(), completed, null, null));
        }
        return out;
    }
}
