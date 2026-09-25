package com.shikshasetu.content;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByChapterId(Long chapterId);

    @Query("select q from Quiz q join fetch q.chapter c join fetch c.subject order by c.subject.id, c.position")
    List<Quiz> findAllWithChapter();
}
