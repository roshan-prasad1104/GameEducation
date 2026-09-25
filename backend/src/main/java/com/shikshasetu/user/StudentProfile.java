package com.shikshasetu.user;

import com.shikshasetu.school.Classroom;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Student-specific data. XP and streak are denormalised here for fast reads;
 * the authoritative XP history lives in xp_transactions.
 */
@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** The student's class; its teacher is the student's teacher. Null until the student joins a class. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    private Integer gradeLevel;

    @Column(length = 160)
    private String school;

    @Column(length = 120)
    private String district;

    @Column(nullable = false)
    private boolean onboarded = false;

    @Column(nullable = false)
    private int xp = 0;

    @Column(nullable = false)
    private int currentStreak = 0;

    @Column(nullable = false)
    private int longestStreak = 0;

    private LocalDate lastActiveDate;

    public StudentProfile(User user) {
        this.user = user;
    }

    /** The teacher of the student's class, or null. */
    public User teacherOrNull() {
        return classroom == null ? null : classroom.getTeacher();
    }
}
