package com.shikshasetu.user;

import jakarta.validation.constraints.*;

public final class AuthDtos {
    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") String email,
            @NotBlank(message = "Password is required") String password) {}

    public record RegisterRequest(
            @NotBlank(message = "Name is required") @Size(max = 120) String name,
            @NotBlank(message = "Email is required") @Email(message = "Enter a valid email") @Size(max = 160) String email,
            @NotBlank(message = "Password is required") @Size(min = 8, max = 72, message = "Password must be 8–72 characters") String password,
            @Min(value = 6, message = "Grade must be 6–12") @Max(value = 12, message = "Grade must be 6–12") Integer gradeLevel) {}

    public record OnboardingRequest(
            @NotNull(message = "Grade is required") @Min(6) @Max(12) Integer gradeLevel,
            @NotBlank @Pattern(regexp = "en|hi", message = "Language must be en or hi") String preferredLanguage,
            @Size(max = 160) String school,
            @Size(max = 120) String district) {}

    public record UpdateMeRequest(
            @NotBlank(message = "Name is required") @Size(max = 120) String name,
            @Pattern(regexp = "en|hi", message = "Language must be en or hi") String preferredLanguage,
            @Min(6) @Max(12) Integer gradeLevel,
            @Size(max = 160) String school,
            @Size(max = 120) String district) {}

    public record UserView(Long id, String name, String email, Role role, String preferredLanguage,
                           Boolean onboarded, Integer gradeLevel, String school, String district) {

        public static UserView of(User u, StudentProfile p) {
            return new UserView(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getPreferredLanguage(),
                    p == null ? null : p.isOnboarded(),
                    p == null ? null : p.getGradeLevel(),
                    p == null ? null : p.getSchool(),
                    p == null ? null : p.getDistrict());
        }
    }

    public record AuthResponse(String token, long expiresInSeconds, UserView user) {}
}
