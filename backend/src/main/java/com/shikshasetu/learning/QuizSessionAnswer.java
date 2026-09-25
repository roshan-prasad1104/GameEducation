package com.shikshasetu.learning;

import com.shikshasetu.content.Question;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** A locked answer: the first option a student confirmed for a question during a session. */
@Entity
@Table(name = "quiz_session_answers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "question_id"}))
@Getter
@Setter
@NoArgsConstructor
public class QuizSessionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private QuizSession session;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private int selectedIndex;

    @Column(nullable = false)
    private boolean correct;

    @Column(nullable = false)
    private Instant answeredAt;
}
