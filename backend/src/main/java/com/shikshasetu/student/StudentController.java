package com.shikshasetu.student;

import com.shikshasetu.ai.AiDtos.RecommendationsView;
import com.shikshasetu.ai.RecommendationService;
import com.shikshasetu.common.ApiException;
import com.shikshasetu.gamification.GamificationDtos.*;
import com.shikshasetu.gamification.GamificationService;
import com.shikshasetu.common.TimeService;
import com.shikshasetu.security.CurrentUser;
import com.shikshasetu.student.StudentDtos.*;
import com.shikshasetu.teacher.AssignmentView;
import com.shikshasetu.user.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Endpoints scoped to the signed-in student ("me"). Secured to ROLE_STUDENT in SecurityConfig. */
@RestController
@RequestMapping("/api/students/me")
@RequiredArgsConstructor
public class StudentController {
    private final StudentService students;
    private final GamificationService gamification;
    private final RecommendationService recommendations;
    private final StudentProfileRepository profiles;
    private final TimeService time;

    @GetMapping("/dashboard")
    public Dashboard dashboard() {
        return students.dashboard(CurrentUser.get());
    }

    @GetMapping("/progress")
    public ProgressView progress() {
        return students.progress(CurrentUser.get());
    }

    @GetMapping("/badges")
    public List<BadgeView> badges() {
        return gamification.badgesFor(CurrentUser.id());
    }

    @GetMapping("/xp")
    public XpSummary xp() {
        return gamification.xpSummary(profiles.findByUserId(CurrentUser.id())
                .orElseThrow(() -> ApiException.notFound("Student profile")));
    }

    @GetMapping("/missions")
    public List<MissionView> missions() {
        return gamification.missionsFor(CurrentUser.id(), time.today());
    }

    @GetMapping("/recommendations")
    public RecommendationsView recommendations(@RequestParam(defaultValue = "4") int limit) {
        return recommendations.forStudent(CurrentUser.id(), Math.max(1, Math.min(limit, 10)));
    }

    @GetMapping("/assignments")
    public List<AssignmentView> assignments() {
        return students.assignments(CurrentUser.id());
    }

    @GetMapping("/leaderboard")
    public Leaderboard leaderboard(@RequestParam(defaultValue = "20") int limit) {
        return gamification.leaderboard(CurrentUser.id(), Math.max(1, Math.min(limit, 100)));
    }
}
