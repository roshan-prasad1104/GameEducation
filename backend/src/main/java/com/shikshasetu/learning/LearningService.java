package com.shikshasetu.learning;

import com.shikshasetu.common.ApiException;
import com.shikshasetu.common.TimeService;
import com.shikshasetu.content.*;
import com.shikshasetu.gamification.GamificationDtos.RewardSummary;
import com.shikshasetu.gamification.GamificationService;
import com.shikshasetu.gamification.XpTransaction.XpSource;
import com.shikshasetu.learning.LearningDtos.*;
import com.shikshasetu.user.StudentProfile;
import com.shikshasetu.user.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Write-side of learning: completing lessons and submitting quizzes.
 * Both operations are idempotent so offline actions can be replayed safely.
 */
@Service
@RequiredArgsConstructor
public class LearningService {
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final LessonProgressRepository progressRepo;
    private final QuizAttemptRepository attemptRepo;
    private final StudentProfileRepository profiles;
    private final GamificationService gamification;
    private final TimeService time;

    @Transactional
    public LessonCompletionResult completeLesson(Long studentId, Long lessonId, CompleteLessonRequest req) {
        boolean offline = req != null && Boolean.TRUE.equals(req.offline());
        Instant at = time.clientTimeOrNow(req == null ? null : req.completedAt());
        return recordLessonCompletion(studentId, lessonId, at, offline);
    }

    /** Records a completion at an explicit time (also used by the demo-data seeder). */
    @Transactional
    public LessonCompletionResult recordLessonCompletion(Long studentId, Long lessonId, Instant at, boolean offline) {
        Lesson lesson = lessons.findById(lessonId).orElseThrow(() -> ApiException.notFound("Lesson"));
        StudentProfile profile = profile(studentId);
        Chapter chapter = lesson.getChapter();
        Long nextId = nextLessonId(chapter, lesson);
        Long quizId = chapter.getQuizzes().isEmpty() ? null : chapter.getQuizzes().getFirst().getId();

        if (progressRepo.existsByStudentIdAndLessonId(studentId, lessonId)) {
            return new LessonCompletionResult(lessonId, true, null, nextId, quizId);
        }

        LessonProgress lp = new LessonProgress(profile.getUser(), lesson, at);
        lp.setSyncedFromOffline(offline);
        progressRepo.save(lp);

        int xpBefore = profile.getXp();
        gamification.awardXp(profile, GamificationService.LESSON_XP, XpSource.LESSON,
                "Completed lesson: " + lesson.getTitle(), "LESSON:" + lessonId, at);
        RewardSummary reward = gamification.finishAction(profile, xpBefore, at);
        return new LessonCompletionResult(lessonId, false, reward, nextId, quizId);
    }

    @Transactional
    public QuizResult submitQuiz(Long studentId, Long quizId, SubmitQuizRequest req) {
        boolean offline = Boolean.TRUE.equals(req.offline());
        Instant at = offline ? time.clientTimeOrNow(req.submittedAt()) : time.now();
        return gradeAttempt(studentId, quizId, req, at, offline);
    }

    /** Grades and stores an attempt at an explicit time (also used by the demo-data seeder). */
    @Transactional
    public QuizResult gradeAttempt(Long studentId, Long quizId, SubmitQuizRequest req, Instant at, boolean offline) {
        Quiz quiz = quizzes.findById(quizId).orElseThrow(() -> ApiException.notFound("Quiz"));
        StudentProfile profile = profile(studentId);

        String clientId = req.clientAttemptId() == null || req.clientAttemptId().isBlank() ? null : req.clientAttemptId();
        if (clientId != null) {
            Optional<QuizAttempt> existing = attemptRepo.findByStudentIdAndClientAttemptId(studentId, clientId);
            if (existing.isPresent()) {
                if (!existing.get().getQuiz().getId().equals(quizId)) {
                    throw ApiException.conflict("This attempt id was already used for a different quiz.");
                }
                return toResult(existing.get(), true, null);
            }
        }

        List<Question> questions = quiz.getQuestions();
        if (questions.isEmpty()) throw ApiException.badRequest("This quiz has no questions yet.");
        Map<Long, Integer> selected = new HashMap<>();
        for (AnswerInput a : req.answers()) selected.put(a.questionId(), a.selectedIndex());

        QuizAttempt attempt = new QuizAttempt();
        attempt.setStudent(profile.getUser());
        attempt.setQuiz(quiz);
        attempt.setClientAttemptId(clientId);
        attempt.setSubmittedAt(at);
        attempt.setSyncedFromOffline(offline);
        attempt.setTimeTakenSeconds(req.timeTakenSeconds());

        int correct = 0;
        for (Question q : questions) {
            Integer choice = selected.get(q.getId());
            if (choice != null && (choice < 0 || choice >= q.getOptions().size())) choice = null;
            boolean ok = choice != null && choice == q.getCorrectIndex();
            if (ok) correct++;
            AttemptAnswer ans = new AttemptAnswer();
            ans.setAttempt(attempt);
            ans.setQuestion(q);
            ans.setSelectedIndex(choice);
            ans.setCorrect(ok);
            attempt.getAnswers().add(ans);
        }
        attempt.setCorrectCount(correct);
        attempt.setTotalQuestions(questions.size());
        attempt.setPercentage(Math.round(100f * correct / questions.size()));
        attemptRepo.save(attempt);

        // XP: full reward on the first attempt, afterwards only for improving your best score.
        int xpBefore = profile.getXp();
        Integer prevBest = attemptRepo.findBestCorrectExcluding(studentId, quizId, attempt.getId());
        int quizXp = prevBest == null
                ? correct * GamificationService.XP_PER_CORRECT + GamificationService.QUIZ_COMPLETION_BONUS
                : Math.max(0, correct - prevBest) * GamificationService.XP_PER_CORRECT;
        gamification.awardXp(profile, quizXp, XpSource.QUIZ,
                (prevBest == null ? "Completed quiz: " : "Improved score: ") + quiz.getTitle(),
                "QUIZ:" + attempt.getId(), at);
        if (attempt.getPercentage() == 100) {
            gamification.awardXp(profile, GamificationService.PERFECT_SCORE_BONUS, XpSource.QUIZ,
                    "Perfect score: " + quiz.getTitle(), "PERFECT:" + quizId, at);
        }
        RewardSummary reward = gamification.finishAction(profile, xpBefore, at);
        attempt.setXpEarned(profile.getXp() - xpBefore);
        return toResult(attempt, false, reward);
    }

    @Transactional(readOnly = true)
    public QuizResult attempt(Long studentId, Long attemptId) {
        QuizAttempt a = attemptRepo.findWithQuizById(attemptId)
                .filter(x -> x.getStudent().getId().equals(studentId))
                .orElseThrow(() -> ApiException.notFound("Attempt"));
        return toResult(a, false, null);
    }

    @Transactional(readOnly = true)
    public List<AttemptSummary> attempts(Long studentId) {
        return attemptRepo.findByStudentIdOrderBySubmittedAtDesc(studentId).stream()
                .map(a -> new AttemptSummary(a.getId(), a.getQuiz().getId(), a.getQuiz().getTitle(),
                        a.getQuiz().getChapter().getId(), a.getQuiz().getChapter().getSubject().getName(),
                        a.getCorrectCount(), a.getTotalQuestions(), a.getPercentage(), a.getXpEarned(),
                        a.getSubmittedAt(), a.isSyncedFromOffline()))
                .toList();
    }

    // ------------------------------------------------------------------ helpers

    private StudentProfile profile(Long studentId) {
        return profiles.findByUserId(studentId).orElseThrow(() -> ApiException.notFound("Student profile"));
    }

    private static Long nextLessonId(Chapter chapter, Lesson lesson) {
        List<Lesson> list = chapter.getLessons();
        int idx = list.indexOf(lesson);
        return idx >= 0 && idx < list.size() - 1 ? list.get(idx + 1).getId() : null;
    }

    private QuizResult toResult(QuizAttempt a, boolean duplicate, RewardSummary reward) {
        Quiz quiz = a.getQuiz();
        Map<Long, AttemptAnswer> byQuestion = a.getAnswers().stream()
                .collect(Collectors.toMap(x -> x.getQuestion().getId(), Function.identity(), (x, y) -> x));
        List<QuestionResult> details = quiz.getQuestions().stream().map(q -> {
            AttemptAnswer ans = byQuestion.get(q.getId());
            return new QuestionResult(q.getId(), q.getPrompt(), List.copyOf(q.getOptions()),
                    ans == null ? null : ans.getSelectedIndex(), q.getCorrectIndex(),
                    ans != null && ans.isCorrect(), q.getExplanation(), q.getTopic());
        }).toList();
        Chapter c = quiz.getChapter();
        return new QuizResult(a.getId(), quiz.getId(), quiz.getTitle(), c.getId(), c.getTitle(),
                c.getSubject().getId(), c.getSubject().getName(), a.getCorrectCount(), a.getTotalQuestions(),
                a.getPercentage(), a.getXpEarned(), a.getTimeTakenSeconds(), a.getSubmittedAt(), duplicate,
                a.isSyncedFromOffline(), details, reward);
    }
}
