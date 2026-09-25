package com.shikshasetu.gamification;

import com.shikshasetu.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Append-only XP ledger. {@code refKey} is unique per student so each reward
 * (e.g. "LESSON:12", "MISSION:DAILY_LESSON:2026-09-25") can be granted only once.
 */
@Entity
@Table(name = "xp_transactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "ref_key"}))
@Getter
@Setter
@NoArgsConstructor
public class XpTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private int amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private XpSource source;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(name = "ref_key", nullable = false, length = 120)
    private String refKey;

    @Column(nullable = false)
    private Instant createdAt;

    public enum XpSource { LESSON, QUIZ, MISSION }
}
