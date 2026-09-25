package com.shikshasetu.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByUserId(Long userId);

    /** Active students in any class taught by the teacher. */
    @Query("select p from StudentProfile p join fetch p.user u join fetch p.classroom c " +
            "where c.teacher.id = :teacherId and u.active = true order by u.name")
    List<StudentProfile> findActiveByTeacherId(Long teacherId);

    @Query("select p from StudentProfile p join fetch p.user u where p.classroom.id = :classroomId and u.active = true order by u.name")
    List<StudentProfile> findActiveByClassroomId(Long classroomId);

    long countByClassroomId(Long classroomId);

    List<StudentProfile> findByClassroomId(Long classroomId);

    @Query("select p from StudentProfile p join fetch p.user u where u.active = true order by p.xp desc, u.name asc")
    List<StudentProfile> findLeaderboard();

    long countByLastActiveDateGreaterThanEqual(LocalDate date);

    void deleteByUserId(Long userId);
}
