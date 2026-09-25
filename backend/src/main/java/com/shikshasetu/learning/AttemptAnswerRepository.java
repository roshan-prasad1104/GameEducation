package com.shikshasetu.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {

    @Query("select new com.shikshasetu.learning.AnswerFact(a.student.id, q.topic, s.id, s.name, aa.correct, a.submittedAt) " +
            "from AttemptAnswer aa join aa.attempt a join aa.question q join q.quiz z join z.chapter c join c.subject s " +
            "where a.student.id in :studentIds")
    List<AnswerFact> findFactsForStudents(Collection<Long> studentIds);

    @Query("select count(aa) from AttemptAnswer aa join aa.attempt a where a.student.id = :studentId " +
            "and a.submittedAt >= :from and a.submittedAt < :to")
    long countAnsweredInRange(Long studentId, Instant from, Instant to);

    boolean existsByQuestionId(Long questionId);
}
