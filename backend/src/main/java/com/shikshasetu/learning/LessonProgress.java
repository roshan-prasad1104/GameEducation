package com.shikshasetu.learning;

import com.shikshasetu.content.Lesson;
import com.shikshasetu.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One row per lesson a student has completed. */
@Entity
@Table(name = "lesson_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "lesson_id"}))
@Getter
@Setter
@NoArgsConstructor
public class LessonProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false)
    private Instant completedAt;

    /** True when the completion was recorded offline and synced later. */
    @Column(nullable = false)
    private boolean syncedFromOffline = false;

    public LessonProgress(User student, Lesson lesson, Instant completedAt) {
        this.student = student;
        this.lesson = lesson;
        this.completedAt = completedAt;
    }
}
