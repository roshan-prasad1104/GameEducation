package com.shikshasetu.learning;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface QuizSessionAnswerRepository extends JpaRepository<QuizSessionAnswer, Long> {

    @Modifying
    @Query("delete from QuizSessionAnswer a where a.question.id = :questionId")
    void deleteByQuestionId(Long questionId);
}
