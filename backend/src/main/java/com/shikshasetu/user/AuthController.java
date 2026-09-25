package com.shikshasetu.user;

import com.shikshasetu.security.CurrentUser;
import com.shikshasetu.user.AuthDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;

    @PostMapping("/api/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @PostMapping("/api/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @GetMapping("/api/auth/me")
    public UserView me() {
        return auth.me(CurrentUser.id());
    }

    @PutMapping("/api/users/me")
    public UserView updateMe(@Valid @RequestBody UpdateMeRequest req) {
        return auth.updateMe(CurrentUser.id(), req);
    }

    @PutMapping("/api/students/me/onboarding")
    public UserView onboard(@Valid @RequestBody OnboardingRequest req) {
        return auth.onboard(CurrentUser.id(), req);
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }
}
