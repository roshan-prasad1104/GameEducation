package com.shikshasetu.learning;

import com.shikshasetu.learning.LearningDtos.*;
import com.shikshasetu.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LearningController {
    private final LearningService learning;

    @PostMapping("/lessons/{id}/complete")
    public LessonCompletionResult complete(@PathVariable Long id,
                                           @RequestBody(required = false) CompleteLessonRequest req) {
        return learning.completeLesson(CurrentUser.id(), id, req);
    }

    @PostMapping("/quizzes/{id}/submit")
    public QuizResult submit(@PathVariable Long id, @Valid @RequestBody SubmitQuizRequest req) {
        return learning.submitQuiz(CurrentUser.id(), id, req);
    }

    @PostMapping("/quizzes/{id}/check")
    public CheckAnswerResult check(@PathVariable Long id, @Valid @RequestBody CheckAnswerRequest req) {
        return learning.checkAnswer(id, req);
    }

    @GetMapping("/students/me/attempts")
    public List<AttemptSummary> attempts() {
        return learning.attempts(CurrentUser.id());
    }

    @GetMapping("/students/me/attempts/{attemptId}")
    public QuizResult attempt(@PathVariable Long attemptId) {
        return learning.attempt(CurrentUser.id(), attemptId);
    }
}
