package com.shikshasetu.content;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "chapters")
@Getter
@Setter
@NoArgsConstructor
public class Chapter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private int position;

    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<Lesson> lessons = new ArrayList<>();

    @OneToMany(mappedBy = "chapter", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Quiz> quizzes = new ArrayList<>();

    /** Translations by language code ("hi", "or", "te"); English is the fields above. */
    @ElementCollection
    @CollectionTable(name = "chapter_translations", joinColumns = @JoinColumn(name = "chapter_id"))
    @MapKeyColumn(name = "language", length = 8)
    private Map<String, Translations.ChapterText> translations = new HashMap<>();
}
