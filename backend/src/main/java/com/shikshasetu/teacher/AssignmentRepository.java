package com.shikshasetu.teacher;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    @EntityGraph(attributePaths = {"student", "classroom", "lesson", "quiz"})
    List<Assignment> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);

    /** Work assigned to the student personally or to their class (classroomId may be null). */
    @EntityGraph(attributePaths = {"lesson", "quiz", "teacher"})
    @Query("select a from Assignment a where a.student.id = :studentId or a.classroom.id = :classroomId order by a.createdAt desc")
    List<Assignment> findForStudent(Long classroomId, Long studentId);

    void deleteByClassroomId(Long classroomId);

    void deleteByStudentId(Long studentId);

    void deleteByTeacherId(Long teacherId);

    void deleteByLessonId(Long lessonId);

    void deleteByQuizId(Long quizId);
}
