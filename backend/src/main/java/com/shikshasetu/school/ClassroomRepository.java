package com.shikshasetu.school;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

    @Query("select c from Classroom c join fetch c.school left join fetch c.teacher order by c.school.name, c.name")
    List<Classroom> findAllWithSchool();

    @Query("select c from Classroom c join fetch c.school where c.teacher.id = :teacherId order by c.name")
    List<Classroom> findByTeacherId(Long teacherId);

    Optional<Classroom> findByJoinCodeIgnoreCase(String joinCode);

    boolean existsByJoinCode(String joinCode);

    boolean existsBySchoolId(Long schoolId);
}
