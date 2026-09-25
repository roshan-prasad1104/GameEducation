package com.shikshasetu.admin;

import com.shikshasetu.admin.AdminDtos.*;
import com.shikshasetu.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Secured to ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminStatsService stats;
    private final AdminUserService users;
    private final AdminContentService content;

    @GetMapping("/stats")
    public Stats stats() {
        return stats.stats();
    }

    // ---- users

    @GetMapping("/users")
    public List<AdminUser> users() {
        return users.list();
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUser createUser(@Valid @RequestBody CreateUserRequest req) {
        return users.create(req);
    }

    @PutMapping("/users/{id}")
    public AdminUser updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req) {
        return users.update(CurrentUser.id(), id, req);
    }

    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        users.delete(CurrentUser.id(), id);
    }

    // ---- content

    @GetMapping("/content")
    public List<ContentSubject> content() {
        return content.tree();
    }

    @PostMapping("/subjects")
    @ResponseStatus(HttpStatus.CREATED)
    public ContentSubject createSubject(@Valid @RequestBody SubjectInput in) {
        return content.createSubject(in);
    }

    @PutMapping("/subjects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateSubject(@PathVariable Long id, @Valid @RequestBody SubjectInput in) {
        content.updateSubject(id, in);
    }

    @DeleteMapping("/subjects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSubject(@PathVariable Long id) {
        content.deleteSubject(id);
    }

    @PostMapping("/chapters")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> createChapter(@Valid @RequestBody ChapterInput in) {
        return Map.of("id", content.createChapter(in));
    }

    @PutMapping("/chapters/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateChapter(@PathVariable Long id, @Valid @RequestBody ChapterInput in) {
        content.updateChapter(id, in);
    }

    @DeleteMapping("/chapters/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteChapter(@PathVariable Long id) {
        content.deleteChapter(id);
    }

    @GetMapping("/lessons/{id}")
    public AdminLesson lesson(@PathVariable Long id) {
        return content.lesson(id);
    }

    @PostMapping("/lessons")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> createLesson(@Valid @RequestBody LessonInput in) {
        return Map.of("id", content.createLesson(in));
    }

    @PutMapping("/lessons/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateLesson(@PathVariable Long id, @Valid @RequestBody LessonInput in) {
        content.updateLesson(id, in);
    }

    @DeleteMapping("/lessons/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLesson(@PathVariable Long id) {
        content.deleteLesson(id);
    }

    @GetMapping("/quizzes/{id}")
    public AdminQuiz quiz(@PathVariable Long id) {
        return content.quiz(id);
    }

    @PostMapping("/quizzes")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> createQuiz(@Valid @RequestBody QuizInput in) {
        return Map.of("id", content.createQuiz(in));
    }

    @PutMapping("/quizzes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateQuiz(@PathVariable Long id, @Valid @RequestBody QuizInput in) {
        content.updateQuiz(id, in);
    }

    @DeleteMapping("/quizzes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuiz(@PathVariable Long id) {
        content.deleteQuiz(id);
    }

    @PostMapping("/questions")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Long> createQuestion(@Valid @RequestBody QuestionInput in) {
        return Map.of("id", content.createQuestion(in));
    }

    @PutMapping("/questions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateQuestion(@PathVariable Long id, @Valid @RequestBody QuestionInput in) {
        content.updateQuestion(id, in);
    }

    @DeleteMapping("/questions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteQuestion(@PathVariable Long id) {
        content.deleteQuestion(id);
    }
}
