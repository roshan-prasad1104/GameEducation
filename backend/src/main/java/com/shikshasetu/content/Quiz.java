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
@Table(name = "quizzes")
@Getter
@Setter
@NoArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "chapter_id", nullable = false)
    private Chapter chapter;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private int timeLimitSeconds = 300;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<Question> questions = new ArrayList<>();

    /** Translations by language code ("hi", "or", "te"); English is the fields above. */
    @ElementCollection
    @CollectionTable(name = "quiz_translations", joinColumns = @JoinColumn(name = "quiz_id"))
    @MapKeyColumn(name = "language", length = 8)
    private Map<String, Translations.QuizText> translations = new HashMap<>();
}
