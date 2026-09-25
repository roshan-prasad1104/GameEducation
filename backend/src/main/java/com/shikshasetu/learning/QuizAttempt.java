package com.shikshasetu.learning;

import com.shikshasetu.content.Quiz;
import com.shikshasetu.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quiz_attempts",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "client_attempt_id"}))
@Getter
@Setter
@NoArgsConstructor
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    /** Client-generated UUID; makes offline re-submission idempotent. */
    @Column(name = "client_attempt_id", length = 64)
    private String clientAttemptId;

    @Column(nullable = false)
    private int correctCount;

    @Column(nullable = false)
    private int totalQuestions;

    /** 0–100, rounded. */
    @Column(nullable = false)
    private int percentage;

    @Column(nullable = false)
    private int xpEarned;

    private Integer timeTakenSeconds;

    @Column(nullable = false)
    private Instant submittedAt;

    @Column(nullable = false)
    private boolean syncedFromOffline = false;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AttemptAnswer> answers = new ArrayList<>();
}
