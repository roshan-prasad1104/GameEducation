package com.shikshasetu.content;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {
    List<Lesson> findByChapterIdOrderByPositionAsc(Long chapterId);

    /** Whole catalog in curriculum order (subject → chapter → lesson). */
    @Query("select l from Lesson l join fetch l.chapter c join fetch c.subject s order by s.id, c.position, l.position")
    List<Lesson> findAllInCurriculumOrder();

    @Query("select count(l) from Lesson l where l.chapter.subject.id = :subjectId")
    long countBySubjectId(Long subjectId);
}
