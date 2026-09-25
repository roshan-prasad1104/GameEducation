package com.shikshasetu.user;

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

    /** Teacher responsible for this student (teacher ↔ student relationship). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

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
}
