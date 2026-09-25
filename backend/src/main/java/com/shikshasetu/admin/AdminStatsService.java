package com.shikshasetu.admin;

import com.shikshasetu.admin.AdminDtos.Stats;
import com.shikshasetu.ai.AiClient;
import com.shikshasetu.common.TimeService;
import com.shikshasetu.content.*;
import com.shikshasetu.learning.LessonProgressRepository;
import com.shikshasetu.learning.QuizAttemptRepository;
import com.shikshasetu.user.Role;
import com.shikshasetu.user.StudentProfileRepository;
import com.shikshasetu.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminStatsService {
    private final UserRepository users;
    private final StudentProfileRepository profiles;
    private final SubjectRepository subjects;
    private final ChapterRepository chapters;
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final QuestionRepository questions;
    private final LessonProgressRepository progress;
    private final QuizAttemptRepository attempts;
    private final AiClient ai;
    private final TimeService time;

    public Stats stats() {
        Map<String, Long> byRole = new LinkedHashMap<>();
        for (Role r : Role.values()) byRole.put(r.name(), users.countByRole(r));
        Instant weekAgo = time.startOf(time.today().minusDays(6));
        return new Stats(byRole,
                profiles.countByLastActiveDateGreaterThanEqual(time.today()),
                profiles.countByLastActiveDateGreaterThanEqual(time.today().minusDays(6)),
                subjects.count(), chapters.count(), lessons.count(), quizzes.count(), questions.count(),
                progress.count(), attempts.count(), (int) Math.round(attempts.averagePercentage()),
                attempts.countBySubmittedAtGreaterThanEqual(weekAgo),
                progress.countByCompletedAtGreaterThanEqual(weekAgo),
                ai.isHealthy());
    }
}
