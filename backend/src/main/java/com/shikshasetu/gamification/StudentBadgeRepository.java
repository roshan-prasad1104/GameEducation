package com.shikshasetu.gamification;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentBadgeRepository extends JpaRepository<StudentBadge, Long> {

    @EntityGraph(attributePaths = {"badge"})
    List<StudentBadge> findByStudentIdOrderByEarnedAtDesc(Long studentId);

    long countByStudentId(Long studentId);

    void deleteByStudentId(Long studentId);
}
