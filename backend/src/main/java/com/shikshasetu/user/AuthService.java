package com.shikshasetu.user;

import com.shikshasetu.common.ApiException;
import com.shikshasetu.gamification.GamificationService;
import com.shikshasetu.school.SchoolService;
import com.shikshasetu.security.JwtService;
import com.shikshasetu.user.AuthDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository users;
    private final StudentProfileRepository profiles;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final GamificationService gamification;
    private final SchoolService schools;

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = users.findByEmailIgnoreCase(req.email().trim())
                .filter(u -> encoder.matches(req.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("bad credentials"));
        if (!user.isActive()) throw new DisabledException("disabled");
        // Checked only after the password, so it reveals nothing to someone without the credentials.
        if (req.role() != null && req.role() != user.getRole()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "ROLE_MISMATCH",
                    "This account is not a " + req.role().name().toLowerCase(Locale.ROOT) + " account. Choose the right role and try again.");
        }
        user.setLastLoginAt(Instant.now());
        return respond(user);
    }

    /** Roles anyone may sign up for. ADMIN is never publicly available: there is one seeded admin. */
    public static final Set<Role> PUBLIC_ROLES = Set.of(Role.STUDENT, Role.TEACHER);

    /**
     * Public self-registration: STUDENT (default) or TEACHER. The requested role is validated here,
     * never trusted; ADMIN is rejected. A new teacher starts without classes, so they see no student
     * data until an admin assigns them a class.
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        Role role = req.role() == null ? Role.STUDENT : req.role();
        if (!PUBLIC_ROLES.contains(role)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ROLE_NOT_ALLOWED", "You can only sign up as a student or a teacher.");
        }
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists.");
        }
        User user = users.save(new User(req.name().trim(), email, encoder.encode(req.password()), role));
        if (role == Role.STUDENT) {
            StudentProfile profile = new StudentProfile(user);
            profile.setGradeLevel(req.gradeLevel());
            // No class yet: the student joins one with the class code (onboarding/profile) or an admin places them.
            profiles.save(profile);
        }
        return respond(user);
    }

    @Transactional(readOnly = true)
    public UserView me(Long userId) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        return view(user, profiles.findByUserId(userId).orElse(null));
    }

    @Transactional
    public UserView onboard(Long userId, OnboardingRequest req) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        StudentProfile p = profiles.findByUserId(userId).orElseThrow(() -> ApiException.notFound("Student profile"));
        p.setGradeLevel(req.gradeLevel());
        p.setSchool(blankToNull(req.school()));
        p.setDistrict(blankToNull(req.district()));
        if (req.classCode() != null && !req.classCode().isBlank()) schools.join(userId, req.classCode());
        p.setOnboarded(true);
        user.setPreferredLanguage(req.preferredLanguage());
        return view(user, p);
    }

    @Transactional
    public UserView updateMe(Long userId, UpdateMeRequest req) {
        User user = users.findById(userId).orElseThrow(() -> ApiException.notFound("User"));
        user.setName(req.name().trim());
        if (req.preferredLanguage() != null) user.setPreferredLanguage(req.preferredLanguage());
        StudentProfile p = profiles.findByUserId(userId).orElse(null);
        if (p != null) {
            if (req.gradeLevel() != null) p.setGradeLevel(req.gradeLevel());
            p.setSchool(blankToNull(req.school()));
            p.setDistrict(blankToNull(req.district()));
        }
        return view(user, p);
    }

    private AuthResponse respond(User user) {
        StudentProfile p = profiles.findByUserId(user.getId()).orElse(null);
        return new AuthResponse(jwt.issue(user), jwt.ttlSeconds(), view(user, p));
    }

    private UserView view(User user, StudentProfile p) {
        return UserView.of(user, p, p == null ? 0 : gamification.effectiveStreak(p));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
