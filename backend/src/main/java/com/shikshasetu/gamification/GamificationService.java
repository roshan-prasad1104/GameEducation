package com.shikshasetu.gamification;

import com.shikshasetu.common.TimeService;
import com.shikshasetu.gamification.GamificationDtos.*;
import com.shikshasetu.learning.AttemptAnswerRepository;
import com.shikshasetu.learning.LessonProgressRepository;
import com.shikshasetu.learning.QuizAttemptRepository;
import com.shikshasetu.user.StudentProfile;
import com.shikshasetu.user.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * XP, levels, streaks, badges and daily missions. Every reward is keyed so it is
 * granted at most once, which also makes offline re-sync safe.
 */
@Service
@RequiredArgsConstructor
public class GamificationService {

    public static final int LESSON_XP = 20;
    public static final int XP_PER_CORRECT = 10;
    public static final int QUIZ_COMPLETION_BONUS = 20;
    public static final int PERFECT_SCORE_BONUS = 25;

    private final XpTransactionRepository xpRepo;
    private final BadgeRepository badgeRepo;
    private final StudentBadgeRepository studentBadgeRepo;
    private final StudentProfileRepository profileRepo;
    private final LessonProgressRepository progressRepo;
    private final QuizAttemptRepository attemptRepo;
    private final AttemptAnswerRepository answerRepo;
    private final TimeService time;

    /** Daily missions. Progress is derived from real activity, so it cannot drift. */
    enum Mission {
        DAILY_LESSON("Complete a lesson", "Finish any lesson today.", 1, 15),
        DAILY_QUIZ("Take a quiz", "Submit any chapter quiz today.", 1, 15),
        DAILY_QUESTIONS("Answer 10 questions", "Answer 10 quiz questions today.", 10, 20),
        DAILY_ACCURACY("Score 80%+", "Score 80% or more on a quiz today.", 1, 25);

        final String title;
        final String description;
        final int target;
        final int xp;

        Mission(String title, String description, int target, int xp) {
            this.title = title;
            this.description = description;
            this.target = target;
            this.xp = xp;
        }
    }

    // ---------------------------------------------------------------- XP

    /** Grants XP once per refKey. Returns the XP actually granted (0 if already granted). */
    @Transactional
    public int awardXp(StudentProfile profile, int amount, XpTransaction.XpSource source,
                       String description, String refKey, Instant at) {
        Long studentId = profile.getUser().getId();
        if (amount <= 0 || xpRepo.existsByStudentIdAndRefKey(studentId, refKey)) return 0;
        XpTransaction tx = new XpTransaction();
        tx.setStudent(profile.getUser());
        tx.setAmount(amount);
        tx.setSource(source);
        tx.setDescription(description);
        tx.setRefKey(refKey);
        tx.setCreatedAt(at);
        xpRepo.save(tx);
        profile.setXp(profile.getXp() + amount);
        return amount;
    }

    /**
     * Called after any learning action: updates the streak, completes missions and
     * unlocks badges, then summarises everything that changed since {@code xpBefore}.
     */
    @Transactional
    public RewardSummary finishAction(StudentProfile profile, int xpBefore, Instant at) {
        LocalDate activityDate = time.dateOf(at);
        recordActivity(profile, activityDate);

        List<MissionView> completed = new ArrayList<>();
        for (MissionView m : missionsFor(profile.getUser().getId(), activityDate)) {
            if (!m.completed()) continue;
            int granted = awardXp(profile, m.xpReward(), XpTransaction.XpSource.MISSION,
                    "Mission: " + m.title(), "MISSION:" + m.code() + ":" + activityDate, at);
            if (granted > 0) completed.add(m);
        }

        List<BadgeView> newBadges = evaluateBadges(profile, at);
        profileRepo.save(profile);

        int levelBefore = Levels.levelFor(xpBefore);
        Levels.LevelInfo level = Levels.info(profile.getXp());
        return new RewardSummary(profile.getXp() - xpBefore, profile.getXp(), level,
                level.level() > levelBefore, effectiveStreak(profile), newBadges, completed);
    }

    // ---------------------------------------------------------------- Streaks

    void recordActivity(StudentProfile profile, LocalDate date) {
        LocalDate last = profile.getLastActiveDate();
        if (last == null) {
            profile.setCurrentStreak(1);
            profile.setLastActiveDate(date);
        } else if (date.isAfter(last)) {
            profile.setCurrentStreak(date.equals(last.plusDays(1)) ? profile.getCurrentStreak() + 1 : 1);
            profile.setLastActiveDate(date);
        }
        // Same day or an older (offline-synced) day: streak unchanged.
        profile.setLongestStreak(Math.max(profile.getLongestStreak(), profile.getCurrentStreak()));
    }

    /** A streak is only "live" if the student was active today or yesterday. */
    public int effectiveStreak(StudentProfile profile) {
        LocalDate last = profile.getLastActiveDate();
        if (last == null) return 0;
        return last.isBefore(time.today().minusDays(1)) ? 0 : profile.getCurrentStreak();
    }

    // ---------------------------------------------------------------- Missions

    public List<MissionView> missionsFor(Long studentId, LocalDate date) {
        Instant from = time.startOf(date);
        Instant to = time.startOf(date.plusDays(1));
        List<MissionView> out = new ArrayList<>();
        for (Mission m : Mission.values()) {
            long progress = switch (m) {
                case DAILY_LESSON -> progressRepo.countInRange(studentId, from, to);
                case DAILY_QUIZ -> attemptRepo.countInRange(studentId, from, to);
                case DAILY_QUESTIONS -> answerRepo.countAnsweredInRange(studentId, from, to);
                case DAILY_ACCURACY -> attemptRepo.countInRangeWithMinPercentage(studentId, from, to, 80);
            };
            int capped = (int) Math.min(progress, m.target);
            out.add(new MissionView(m.name(), m.title, m.description, capped, m.target, m.xp, capped >= m.target));
        }
        return out;
    }

    // ---------------------------------------------------------------- Badges

    List<BadgeView> evaluateBadges(StudentProfile profile, Instant at) {
        Long studentId = profile.getUser().getId();
        Set<String> owned = studentBadgeRepo.findByStudentIdOrderByEarnedAtDesc(studentId).stream()
                .map(sb -> sb.getBadge().getCode()).collect(Collectors.toSet());
        StudentStats stats = statsFor(profile);

        List<BadgeView> unlocked = new ArrayList<>();
        for (BadgeRule rule : BadgeRule.values()) {
            if (owned.contains(rule.name()) || !rule.isMet(stats)) continue;
            Badge badge = badgeRepo.findByCode(rule.name()).orElseGet(() -> badgeRepo.save(
                    new Badge(rule.name(), rule.displayName(), rule.description(), rule.icon())));
            studentBadgeRepo.save(new StudentBadge(profile.getUser(), badge, at));
            unlocked.add(toView(badge, true, at));
        }
        return unlocked;
    }

    private StudentStats statsFor(StudentProfile profile) {
        Long id = profile.getUser().getId();
        Map<String, Long> bySubject = new HashMap<>();
        for (Object[] row : progressRepo.countBySubjectCode(id)) {
            bySubject.put((String) row[0], (Long) row[1]);
        }
        return new StudentStats(
                progressRepo.countByStudentId(id),
                attemptRepo.countByStudentId(id),
                attemptRepo.countByStudentIdAndPercentageGreaterThanEqual(id, 100) > 0,
                attemptRepo.countByStudentIdAndPercentageGreaterThanEqual(id, 80),
                profile.getLongestStreak(),
                profile.getXp(),
                bySubject);
    }

    /** All badges with earned/locked state for one student. */
    public List<BadgeView> badgesFor(Long studentId) {
        Map<String, Instant> earned = studentBadgeRepo.findByStudentIdOrderByEarnedAtDesc(studentId).stream()
                .collect(Collectors.toMap(sb -> sb.getBadge().getCode(), StudentBadge::getEarnedAt, (a, b) -> a));
        return badgeRepo.findAllByOrderByIdAsc().stream()
                .map(b -> toView(b, earned.containsKey(b.getCode()), earned.get(b.getCode())))
                .toList();
    }

    /** Creates badge rows for any rule that does not have one yet (idempotent). */
    @Transactional
    public void ensureBadgeCatalogue() {
        for (BadgeRule rule : BadgeRule.values()) {
            if (badgeRepo.findByCode(rule.name()).isEmpty()) {
                badgeRepo.save(new Badge(rule.name(), rule.displayName(), rule.description(), rule.icon()));
            }
        }
    }

    private static BadgeView toView(Badge b, boolean earned, Instant earnedAt) {
        return new BadgeView(b.getCode(), b.getName(), b.getDescription(), b.getIcon(), earned, earnedAt);
    }

    // ---------------------------------------------------------------- Read models

    public XpSummary xpSummary(StudentProfile profile) {
        Long id = profile.getUser().getId();
        LocalDate monday = time.today().with(DayOfWeek.MONDAY);
        List<XpEntry> recent = xpRepo.findTop20ByStudentIdOrderByCreatedAtDesc(id).stream()
                .map(x -> new XpEntry(x.getAmount(), x.getSource().name(), x.getDescription(), x.getCreatedAt()))
                .toList();
        return new XpSummary(profile.getXp(), Levels.info(profile.getXp()),
                xpRepo.sumSince(id, time.startOf(monday)), recent);
    }

    public Leaderboard leaderboard(Long currentStudentId, int limit) {
        List<StudentProfile> all = profileRepo.findLeaderboard();
        List<LeaderboardEntry> entries = new ArrayList<>();
        LeaderboardEntry me = null;
        for (int i = 0; i < all.size(); i++) {
            StudentProfile p = all.get(i);
            boolean isMe = Objects.equals(p.getUser().getId(), currentStudentId);
            LeaderboardEntry e = new LeaderboardEntry(i + 1, p.getUser().getId(), p.getUser().getName(),
                    p.getGradeLevel(), p.getSchool(), p.getXp(), Levels.levelFor(p.getXp()), effectiveStreak(p), isMe);
            if (i < limit) entries.add(e);
            if (isMe) me = e;
        }
        return new Leaderboard(entries, me);
    }
}
