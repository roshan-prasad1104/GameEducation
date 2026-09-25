package com.shikshasetu.learning;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    boolean existsByStudentIdAndLessonId(Long studentId, Long lessonId);

    long countByStudentId(Long studentId);

    long countByCompletedAtGreaterThanEqual(Instant since);

    @Query("select lp.lesson.id from LessonProgress lp where lp.student.id = :studentId")
    Set<Long> findCompletedLessonIds(Long studentId);

    @Query("select count(lp) from LessonProgress lp where lp.student.id = :studentId and lp.completedAt >= :from and lp.completedAt < :to")
    long countInRange(Long studentId, Instant from, Instant to);

    @EntityGraph(attributePaths = {"lesson", "lesson.chapter", "lesson.chapter.subject"})
    List<LessonProgress> findByStudentIdOrderByCompletedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {"lesson", "lesson.chapter", "lesson.chapter.subject"})
    List<LessonProgress> findByStudentIdIn(Collection<Long> studentIds);

    @Query("select s.code, count(lp) from LessonProgress lp join lp.lesson l join l.chapter c join c.subject s " +
            "where lp.student.id = :studentId group by s.code")
    List<Object[]> countBySubjectCode(Long studentId);

    void deleteByStudentId(Long studentId);

    boolean existsByLessonId(Long lessonId);
}
