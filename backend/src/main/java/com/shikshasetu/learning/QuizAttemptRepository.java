package com.shikshasetu.learning;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    Optional<QuizAttempt> findByStudentIdAndClientAttemptId(Long studentId, String clientAttemptId);

    @EntityGraph(attributePaths = {"quiz", "quiz.chapter", "quiz.chapter.subject"})
    List<QuizAttempt> findByStudentIdOrderBySubmittedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {"quiz", "quiz.chapter", "quiz.chapter.subject"})
    List<QuizAttempt> findByStudentIdIn(Collection<Long> studentIds);

    @EntityGraph(attributePaths = {"quiz", "quiz.chapter", "quiz.chapter.subject", "student"})
    Optional<QuizAttempt> findWithQuizById(Long id);

    long countByStudentId(Long studentId);

    boolean existsByQuizId(Long quizId);

    long countBySubmittedAtGreaterThanEqual(Instant since);

    long countByStudentIdAndPercentageGreaterThanEqual(Long studentId, int percentage);

    @Query("select max(a.correctCount) from QuizAttempt a where a.student.id = :studentId and a.quiz.id = :quizId and a.id <> :excludeId")
    Integer findBestCorrectExcluding(Long studentId, Long quizId, Long excludeId);

    @Query("select max(a.percentage) from QuizAttempt a where a.student.id = :studentId and a.quiz.id = :quizId")
    Integer findBestPercentage(Long studentId, Long quizId);

    @Query("select count(a) from QuizAttempt a where a.student.id = :studentId and a.submittedAt >= :from and a.submittedAt < :to")
    long countInRange(Long studentId, Instant from, Instant to);

    @Query("select count(a) from QuizAttempt a where a.student.id = :studentId and a.submittedAt >= :from and a.submittedAt < :to and a.percentage >= :minPct")
    long countInRangeWithMinPercentage(Long studentId, Instant from, Instant to, int minPct);

    @Query("select coalesce(avg(a.percentage), 0) from QuizAttempt a")
    double averagePercentage();

    void deleteByStudentId(Long studentId);
}
