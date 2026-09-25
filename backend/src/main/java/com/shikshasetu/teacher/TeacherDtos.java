package com.shikshasetu.teacher;

import com.shikshasetu.learning.LearningDtos.AttemptSummary;
import com.shikshasetu.student.StudentDtos.ActivityItem;
import com.shikshasetu.student.StudentDtos.SubjectProgress;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public final class TeacherDtos {
    private TeacherDtos() {}

    public record StudentRow(Long id, String name, String email, Integer gradeLevel, int xp, int level, int streak,
                             int lessonsCompleted, int quizAttempts, Integer averageScore, LocalDate lastActive,
                             int activeDays, String segment, String segmentReason, String weakestTopic) {}

    public record Bucket(String label, int count) {}

    public record SubjectPerformance(Long subjectId, String subjectName, String color, Integer averageScore,
                                     int attempts, int completionPercent) {}

    public record DayPoint(LocalDate date, int lessons, int quizzes) {}

    public record TopicStat(String topic, String topicName, Long subjectId, String subjectName, int answered,
                            int correct, int accuracy, int studentsStruggling, Long lessonId, String lessonTitle) {}

    public record TeacherActivity(String studentName, ActivityItem item) {}

    public record Overview(int totalStudents, int activeStudents, Integer averageScore, int lessonsCompleted,
                           int quizAttempts, int needsSupport, String segmentModel, List<Bucket> scoreDistribution,
                           List<Bucket> segments, List<SubjectPerformance> subjectPerformance,
                           List<DayPoint> activity, List<TopicStat> weakTopics, List<TeacherActivity> recentActivity) {}

    public record StudentDetail(StudentRow student, List<SubjectProgress> subjects, List<AttemptSummary> attempts,
                                List<TopicStat> topics) {}

    public record CreateAssignmentRequest(
            @NotBlank(message = "Title is required") @Size(max = 160) String title,
            @Size(max = 500) String note,
            LocalDate dueDate,
            Long lessonId,
            Long quizId,
            Long studentId,
            Long classId) {}
}
