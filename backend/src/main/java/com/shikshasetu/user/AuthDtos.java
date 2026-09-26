package com.shikshasetu.user;

import com.shikshasetu.gamification.Levels;
import jakarta.validation.constraints.*;

public final class AuthDtos {
    private AuthDtos() {}

    /**
     * {@code role} is the role picked on the sign-in screen. When present, a correct password for an
     * account with a different role is rejected (ROLE_MISMATCH) and no token is issued. The stored
     * role is always what the backend authorises with.
     */
    public record LoginRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "Password is required") String password,
            Role role) {}

    public record RegisterRequest(
            @NotBlank(message = "Name is required") @Size(max = 120) String name,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") @Size(max = 160) String email,
            @NotBlank(message = "Password is required") @Size(min = 8, max = 72, message = "Password must be 8–72 characters") String password,
            @Min(value = 6, message = "Grade must be 6–12") @Max(value = 12, message = "Grade must be 6–12") Integer gradeLevel,
            Role role) {}

    public record OnboardingRequest(
            @NotNull(message = "Grade is required") @Min(6) @Max(12) Integer gradeLevel,
            @NotBlank @Pattern(regexp = "en|hi|or|te", message = "Unsupported language") String preferredLanguage,
            @Size(max = 160) String school,
            @Size(max = 120) String district,
            @Size(max = 12) String classCode) {}

    public record UpdateMeRequest(
            @NotBlank(message = "Name is required") @Size(max = 120) String name,
            @Pattern(regexp = "en|hi|or|te", message = "Unsupported language") String preferredLanguage,
            @Min(6) @Max(12) Integer gradeLevel,
            @Size(max = 160) String school,
            @Size(max = 120) String district) {}

    public record UserView(Long id, String name, String email, Role role, String preferredLanguage,
                           Boolean onboarded, Integer gradeLevel, String school, String district,
                           Integer xp, Integer level, Integer streak,
                           Long classId, String className, String teacherName) {

        /** {@code streak} is the live streak (0 if broken); ignored for staff accounts. */
        public static UserView of(User u, StudentProfile p, int streak) {
            return new UserView(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getPreferredLanguage(),
                    p == null ? null : p.isOnboarded(),
                    p == null ? null : p.getGradeLevel(),
                    p == null ? null : p.getSchool(),
                    p == null ? null : p.getDistrict(),
                    p == null ? null : p.getXp(),
                    p == null ? null : Levels.levelFor(p.getXp()),
                    p == null ? null : streak,
                    p == null || p.getClassroom() == null ? null : p.getClassroom().getId(),
                    p == null || p.getClassroom() == null ? null : p.getClassroom().getName(),
                    p == null || p.teacherOrNull() == null ? null : p.teacherOrNull().getName());
        }
    }

    public record AuthResponse(String token, long expiresInSeconds, UserView user) {}
}
