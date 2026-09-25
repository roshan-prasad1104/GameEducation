package com.shikshasetu.gamification;

import com.shikshasetu.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "student_badges",
        uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "badge_id"}))
@Getter
@Setter
@NoArgsConstructor
public class StudentBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @Column(nullable = false)
    private Instant earnedAt;

    public StudentBadge(User student, Badge badge, Instant earnedAt) {
        this.student = student;
        this.badge = badge;
        this.earnedAt = earnedAt;
    }
}
