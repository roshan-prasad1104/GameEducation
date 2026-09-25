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
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Stable key such as "math" or "physics" (used by badges and icons). */
    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 16)
    private String color;

    @Column(length = 40)
    private String icon;

    private Integer gradeLevel;

    @OneToMany(mappedBy = "subject", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<Chapter> chapters = new ArrayList<>();

    /** Translations by language code ("hi", "or", "te"); English is the fields above. */
    @ElementCollection
    @CollectionTable(name = "subject_translations", joinColumns = @JoinColumn(name = "subject_id"))
    @MapKeyColumn(name = "language", length = 8)
    private Map<String, Translations.SubjectText> translations = new HashMap<>();
}
