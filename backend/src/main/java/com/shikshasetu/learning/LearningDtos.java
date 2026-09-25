package com.shikshasetu.learning;

import com.shikshasetu.gamification.GamificationDtos.RewardSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

public final class LearningDtos {
    private LearningDtos() {}

    /** Both fields are optional; they are set when an offline action is being synced. */
    public record CompleteLessonRequest(Instant completedAt, Boolean offline) {}

    public record LessonCompletionResult(Long lessonId, boolean alreadyCompleted, RewardSummary reward,
                                         Long nextLessonId, Long quizId) {}

    public record AnswerInput(@NotNull Long questionId, Integer selectedIndex) {}

    public record SubmitQuizRequest(
            @NotNull(message = "Answers are required") @Size(max = 100) List<@Valid AnswerInput> answers,
            @PositiveOrZero Integer timeTakenSeconds,
            @Size(max = 64) String clientAttemptId,
            Instant submittedAt,
            Boolean offline) {}

    public record QuestionResult(Long questionId, String prompt, List<String> options, Integer selectedIndex,
                                 int correctIndex, boolean correct, String explanation, String topic) {}

    public record QuizResult(Long attemptId, Long quizId, String quizTitle, Long chapterId, String chapterTitle,
                             Long subjectId, String subjectName, int correctCount, int totalQuestions, int percentage,
                             int xpEarned, Integer timeTakenSeconds, Instant submittedAt, boolean duplicate,
                             boolean syncedFromOffline, List<QuestionResult> questions, RewardSummary reward) {}

    public record AttemptSummary(Long attemptId, Long quizId, String quizTitle, Long chapterId, String subjectName,
                                 int correctCount, int totalQuestions, int percentage, int xpEarned,
                                 Instant submittedAt, boolean syncedFromOffline) {}
}
