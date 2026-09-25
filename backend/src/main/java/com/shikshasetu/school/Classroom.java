package com.shikshasetu.school;

import com.shikshasetu.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.security.SecureRandom;
import java.time.Instant;

/**
 * A class (e.g. "Class 8 – Section A") at a school. Students belong to one class; the class's
 * teacher sees their analytics and can assign them work. Students join with the join code.
 */
@Entity
@Table(name = "classrooms")
@Getter
@Setter
@NoArgsConstructor
public class Classroom {
    /** Unambiguous characters only (no 0/O, 1/I/L) so codes can be read out in a classroom. */
    private static final String CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id", nullable = false)
    private School school;

    @Column(nullable = false, length = 80)
    private String name;

    private Integer gradeLevel;

    /** Null while the class has no teacher yet. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private User teacher;

    @Column(name = "join_code", nullable = false, unique = true, length = 12)
    private String joinCode;

    @Column(nullable = false)
    private Instant createdAt;

    public static String newJoinCode() {
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
        return sb.toString();
    }
}
