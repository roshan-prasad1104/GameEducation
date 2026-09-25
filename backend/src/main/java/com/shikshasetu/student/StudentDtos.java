package com.shikshasetu.student;

import com.shikshasetu.content.CatalogDtos.ChapterCard;
import com.shikshasetu.content.CatalogDtos.SubjectCard;
import com.shikshasetu.gamification.GamificationDtos.BadgeView;
import com.shikshasetu.gamification.GamificationDtos.MissionView;
import com.shikshasetu.gamification.Levels.LevelInfo;
import com.shikshasetu.learning.LearningDtos.AttemptSummary;
import com.shikshasetu.teacher.AssignmentView;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class StudentDtos {
    private StudentDtos() {}

    public record LessonPointer(Long lessonId, String lessonTitle, Long chapterId, String chapterTitle,
                                Long subjectId, String subjectName, String subjectColor) {}

    public record ActivityItem(String type, String title, String detail, Instant at) {}

    public record Dashboard(String name, Integer gradeLevel, String school, LevelInfo level, int streak,
                            int longestStreak, long xpThisWeek, long lessonsCompleted, long totalLessons,
                            long quizzesTaken, int averageScore, List<SubjectCard> subjects,
                            LessonPointer continueLesson, List<MissionView> missions,
                            List<AssignmentView> assignments, List<BadgeView> recentBadges, int badgesEarned,
                            int badgesTotal, List<ActivityItem> recentActivity) {}

    public record SubjectProgress(SubjectCard subject, List<ChapterCard> chapters, Integer averageQuizScore) {}

    public record DayActivity(LocalDate date, int lessons, int quizzes) {}

    public record ProgressView(List<SubjectProgress> subjects, List<AttemptSummary> attempts,
                               List<DayActivity> last7Days) {}
}
