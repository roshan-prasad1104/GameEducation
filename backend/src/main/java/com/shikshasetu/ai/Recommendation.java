package com.shikshasetu.ai;

import com.shikshasetu.content.Lesson;
import com.shikshasetu.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** Latest recommendation snapshot per student (replaced each time recommendations are generated). */
@Entity
@Table(name = "recommendations")
@Getter
@Setter
@NoArgsConstructor
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false, length = 16)
    private String kind;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(nullable = false)
    private double priority;

    /** Which engine produced it: the Python model or the Java fallback. */
    @Column(nullable = false, length = 40)
    private String source;

    @Column(nullable = false)
    private Instant createdAt;
}
