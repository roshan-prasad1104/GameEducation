package com.shikshasetu.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(nullable = false, length = 160)
    private String title;

    /** Topic slug (e.g. "linear-equations") linking lessons to quiz questions for weak-topic analysis. */
    @Column(nullable = false, length = 80)
    private String topic;

    @Column(length = 500)
    private String summary;

    /** Lesson body in a small Markdown subset. */
    @Column(nullable = false, length = 20000)
    private String content;

    @Column(length = 300)
    private String videoUrl;

    @Column(nullable = false)
    private int durationMinutes = 10;

    @Column(nullable = false)
    private int position;
}
