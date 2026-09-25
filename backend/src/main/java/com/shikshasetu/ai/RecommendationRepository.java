package com.shikshasetu.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    @Modifying
    @Query("delete from Recommendation r where r.student.id = :studentId")
    void deleteAllForStudent(Long studentId);

    @Modifying
    @Query("delete from Recommendation r where r.lesson.id = :lessonId")
    void deleteAllForLesson(Long lessonId);
}
