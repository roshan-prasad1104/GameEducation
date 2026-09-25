package com.shikshasetu.admin;

import com.shikshasetu.user.Role;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public final class AdminDtos {
    private AdminDtos() {}

    public record Stats(Map<String, Long> usersByRole, long activeStudentsToday, long activeStudentsThisWeek,
                        long subjects, long chapters, long lessons, long quizzes, long questions,
                        long lessonsCompleted, long quizAttempts, int averageScore, long attemptsLast7Days,
                        long completionsLast7Days, boolean aiServiceUp) {}

    public record AdminUser(Long id, String name, String email, Role role, boolean active, Instant createdAt,
                            Instant lastLoginAt, Integer gradeLevel, Long teacherId, String teacherName, Integer xp,
                            LocalDate lastActive) {}

    public record CreateUserRequest(
            @NotBlank(message = "Name is required") @Size(max = 120) String name,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank @Size(min = 8, max = 72, message = "Password must be 8–72 characters") String password,
            @NotNull(message = "Role is required") Role role,
            @Min(6) @Max(12) Integer gradeLevel,
            Long teacherId) {}

    public record UpdateUserRequest(
            @NotBlank(message = "Name is required") @Size(max = 120) String name,
            @NotNull Boolean active,
            @Min(6) @Max(12) Integer gradeLevel,
            Long teacherId,
            @Size(min = 8, max = 72, message = "Password must be 8–72 characters") String newPassword) {}

    public record SubjectInput(
            @NotBlank @Size(max = 40) @Pattern(regexp = "[a-z0-9-]+", message = "Use lowercase letters, digits and dashes") String code,
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description,
            @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "Use a hex colour like #6366f1") String color,
            @Size(max = 40) String icon,
            @Min(6) @Max(12) Integer gradeLevel) {}

    public record ChapterInput(@NotNull Long subjectId, @NotBlank @Size(max = 160) String title,
                               @Size(max = 500) String description, @Min(1) Integer position) {}

    public record LessonInput(@NotNull Long chapterId, @NotBlank @Size(max = 160) String title,
                              @NotBlank @Size(max = 80) @Pattern(regexp = "[a-z0-9-]+", message = "Topic must be a lowercase slug") String topic,
                              @Size(max = 500) String summary, @NotBlank @Size(max = 20000) String content,
                              @Size(max = 300) String videoUrl, @Min(1) @Max(180) Integer durationMinutes,
                              @Min(1) Integer position) {}

    public record QuizInput(@NotNull Long chapterId, @NotBlank @Size(max = 160) String title,
                            @Size(max = 500) String description, @Min(30) @Max(7200) Integer timeLimitSeconds) {}

    public record QuestionInput(@NotNull Long quizId, @NotBlank @Size(max = 1000) String prompt,
                                @NotNull @Size(min = 2, max = 6, message = "Provide 2–6 options") List<@NotBlank @Size(max = 500) String> options,
                                @NotNull @Min(0) Integer correctIndex, @Size(max = 1000) String explanation,
                                @NotBlank @Size(max = 80) String topic) {}

    public record ContentLesson(Long id, String title, String topic, int position, int durationMinutes) {}

    public record ContentQuiz(Long id, String title, int questionCount, int timeLimitSeconds) {}

    public record ContentChapter(Long id, String title, String description, int position, List<ContentLesson> lessons,
                                 List<ContentQuiz> quizzes) {}

    public record ContentSubject(Long id, String code, String name, String description, String color, String icon,
                                 Integer gradeLevel, List<ContentChapter> chapters) {}

    public record AdminLesson(Long id, Long chapterId, String title, String topic, String summary, String content,
                              String videoUrl, int durationMinutes, int position) {}

    public record AdminQuestion(Long id, String prompt, List<String> options, int correctIndex, String explanation,
                                String topic, int position) {}

    public record AdminQuiz(Long id, Long chapterId, String chapterTitle, String title, String description,
                            int timeLimitSeconds, List<AdminQuestion> questions, List<String> chapterTopics) {}
}
