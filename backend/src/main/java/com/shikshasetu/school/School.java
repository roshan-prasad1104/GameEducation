package com.shikshasetu.school;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** A school, managed by admins. Classes belong to a school. */
@Entity
@Table(name = "schools", uniqueConstraints = @UniqueConstraint(columnNames = {"name", "district"}))
@Getter
@Setter
@NoArgsConstructor
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(length = 120)
    private String district;

    @OneToMany(mappedBy = "school")
    @OrderBy("name")
    private List<Classroom> classes = new ArrayList<>();

    public School(String name, String district) {
        this.name = name;
        this.district = district;
    }
}
