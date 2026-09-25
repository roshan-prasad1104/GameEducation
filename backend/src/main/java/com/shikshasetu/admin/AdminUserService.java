package com.shikshasetu.admin;

import com.shikshasetu.admin.AdminDtos.*;
import com.shikshasetu.ai.RecommendationRepository;
import com.shikshasetu.common.ApiException;
import com.shikshasetu.gamification.StudentBadgeRepository;
import com.shikshasetu.gamification.XpTransactionRepository;
import com.shikshasetu.learning.LessonProgressRepository;
import com.shikshasetu.learning.QuizAttemptRepository;
import com.shikshasetu.learning.QuizSessionRepository;
import com.shikshasetu.school.SchoolService;
import com.shikshasetu.teacher.AssignmentRepository;
import com.shikshasetu.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private final UserRepository users;
    private final StudentProfileRepository profiles;
    private final PasswordEncoder encoder;
    private final QuizAttemptRepository attempts;
    private final LessonProgressRepository progress;
    private final XpTransactionRepository xp;
    private final StudentBadgeRepository badges;
    private final RecommendationRepository recommendations;
    private final AssignmentRepository assignments;
    private final QuizSessionRepository quizSessions;
    private final SchoolService schools;

    @Transactional(readOnly = true)
    public List<AdminUser> list() {
        Map<Long, StudentProfile> byUser = profiles.findAll().stream()
                .collect(Collectors.toMap(p -> p.getUser().getId(), Function.identity()));
        return users.findAllByOrderByCreatedAtDesc().stream().map(u -> view(u, byUser.get(u.getId()))).toList();
    }

    @Transactional
    public AdminUser create(CreateUserRequest req) {
        String email = req.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) throw ApiException.conflict("An account with this email already exists.");
        User u = users.save(new User(req.name().trim(), email, encoder.encode(req.password()), req.role()));
        StudentProfile p = null;
        if (req.role() == Role.STUDENT) {
            p = new StudentProfile(u);
            p.setGradeLevel(req.gradeLevel());
            schools.placeStudent(p, req.classId());
            profiles.save(p);
        }
        return view(u, p);
    }

    @Transactional
    public AdminUser update(Long actingAdminId, Long id, UpdateUserRequest req) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        if (u.getId().equals(actingAdminId) && !req.active()) {
            throw ApiException.badRequest("You cannot deactivate your own account.");
        }
        u.setName(req.name().trim());
        u.setActive(req.active());
        if (req.newPassword() != null && !req.newPassword().isBlank()) u.setPasswordHash(encoder.encode(req.newPassword()));
        StudentProfile p = profiles.findByUserId(id).orElse(null);
        if (p != null) {
            p.setGradeLevel(req.gradeLevel());
            schools.placeStudent(p, req.classId());
        }
        return view(u, p);
    }

    /** Hard delete, including the student's learning history. */
    @Transactional
    public void delete(Long actingAdminId, Long id) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User"));
        if (u.getId().equals(actingAdminId)) throw ApiException.badRequest("You cannot delete your own account.");
        switch (u.getRole()) {
            case STUDENT -> {
                quizSessions.deleteAnswersByStudentId(id);
                quizSessions.deleteSessionsByStudentId(id);
                attempts.deleteAll(attempts.findByStudentIdOrderBySubmittedAtDesc(id));
                progress.deleteByStudentId(id);
                xp.deleteByStudentId(id);
                badges.deleteByStudentId(id);
                recommendations.deleteAllForStudent(id);
                assignments.deleteByStudentId(id);
                profiles.deleteByUserId(id);
            }
            case TEACHER -> {
                schools.releaseTeacher(id);
                assignments.deleteByTeacherId(id);
            }
            case ADMIN -> { }
        }
        users.delete(u);
    }

    private static AdminUser view(User u, StudentProfile p) {
        return new AdminUser(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.isActive(), u.getCreatedAt(),
                u.getLastLoginAt(), p == null ? null : p.getGradeLevel(),
                p == null || p.getClassroom() == null ? null : p.getClassroom().getId(),
                p == null || p.getClassroom() == null ? null : p.getClassroom().getName(),
                p == null || p.teacherOrNull() == null ? null : p.teacherOrNull().getName(),
                p == null ? null : p.getXp(), p == null ? null : p.getLastActiveDate());
    }
}
