package com.shikshasetu.teacher;

import com.shikshasetu.content.Lesson;
import com.shikshasetu.content.Quiz;
import com.shikshasetu.user.User;
import com.shikshasetu.school.Classroom;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/**
 * A learning activity a teacher assigns: one lesson or one quiz, either to a single
 * student or to a whole class (exactly one of {@code student} and {@code classroom} is set).
 */
@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id")
    private Lesson lesson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id")
    private Quiz quiz;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 500)
    private String note;

    private LocalDate dueDate;

    @Column(nullable = false)
    private Instant createdAt;
}
