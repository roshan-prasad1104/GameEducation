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

/**
 * An online quiz in progress. Instant feedback for a question is only given once the student's
 * answer is stored here, and a stored answer cannot be changed, so feedback cannot be used to
 * probe the answer key. The answers are graded again on submit and the session is closed.
 */
@Entity
@Table(name = "quiz_sessions")
@Getter
@Setter
@NoArgsConstructor
public class QuizSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    /** "studentId:quizId" while open, null once submitted: a unique key allowing one open session per quiz. */
    @Column(name = "open_key", length = 64, unique = true)
    private String openKey;

    @Column(nullable = false)
    private Instant startedAt;

    private Instant submittedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id")
    private QuizAttempt attempt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("answeredAt")
    private List<QuizSessionAnswer> answers = new ArrayList<>();

    public static String openKey(Long studentId, Long quizId) {
        return studentId + ":" + quizId;
    }
}
