package com.shikshasetu.gamification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.List;

public interface XpTransactionRepository extends JpaRepository<XpTransaction, Long> {

    boolean existsByStudentIdAndRefKey(Long studentId, String refKey);

    List<XpTransaction> findTop20ByStudentIdOrderByCreatedAtDesc(Long studentId);

    @Query("select coalesce(sum(x.amount), 0) from XpTransaction x where x.student.id = :studentId and x.createdAt >= :since")
    long sumSince(Long studentId, Instant since);

    void deleteByStudentId(Long studentId);
}
