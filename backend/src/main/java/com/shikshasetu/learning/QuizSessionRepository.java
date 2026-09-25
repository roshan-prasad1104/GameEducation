package com.shikshasetu.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface QuizSessionRepository extends JpaRepository<QuizSession, Long> {

    Optional<QuizSession> findByOpenKey(String openKey);

    @Modifying
    @Query("delete from QuizSessionAnswer a where a.session.id in (select s.id from QuizSession s where s.quiz.id = :quizId)")
    void deleteAnswersByQuizId(Long quizId);

    @Modifying
    @Query("delete from QuizSession s where s.quiz.id = :quizId")
    void deleteSessionsByQuizId(Long quizId);

    @Modifying
    @Query("delete from QuizSessionAnswer a where a.session.id in (select s.id from QuizSession s where s.student.id = :studentId)")
    void deleteAnswersByStudentId(Long studentId);

    @Modifying
    @Query("delete from QuizSession s where s.student.id = :studentId")
    void deleteSessionsByStudentId(Long studentId);
}
