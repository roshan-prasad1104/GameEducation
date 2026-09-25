package com.shikshasetu.teacher;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    @EntityGraph(attributePaths = {"student", "lesson", "quiz"})
    List<Assignment> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    @EntityGraph(attributePaths = {"lesson", "quiz", "teacher"})
    @Query("select a from Assignment a where a.teacher.id = :teacherId and (a.student is null or a.student.id = :studentId) order by a.createdAt desc")
    List<Assignment> findForStudent(Long teacherId, Long studentId);

    void deleteByStudentId(Long studentId);

    void deleteByTeacherId(Long teacherId);

    void deleteByLessonId(Long lessonId);

    void deleteByQuizId(Long quizId);
}
