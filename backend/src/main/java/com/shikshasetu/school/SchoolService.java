package com.shikshasetu.school;

import com.shikshasetu.common.ApiException;
import com.shikshasetu.school.SchoolDtos.*;
import com.shikshasetu.teacher.AssignmentRepository;
import com.shikshasetu.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Schools and classes. Admins manage them and assign teachers; students join a class with its
 * code (or are placed by an admin); teachers only ever see the classes they teach.
 */
@Service
@RequiredArgsConstructor
public class SchoolService {
    private final SchoolRepository schools;
    private final ClassroomRepository classes;
    private final StudentProfileRepository profiles;
    private final UserRepository users;
    private final AssignmentRepository assignments;

    // ------------------------------------------------------------------ admin

    @Transactional(readOnly = true)
    public List<SchoolView> schoolsWithClasses() {
        List<Classroom> all = classes.findAllWithSchool();
        return schools.findAllByOrderByNameAsc().stream().map(s -> new SchoolView(s.getId(), s.getName(), s.getDistrict(),
                all.stream().filter(c -> c.getSchool().getId().equals(s.getId())).map(this::view).toList())).toList();
    }

    @Transactional
    public SchoolView createSchool(SchoolInput in) {
        String name = in.name().trim();
        String district = blankToNull(in.district());
        boolean exists = schools.findAllByOrderByNameAsc().stream().anyMatch(s -> s.getName().equalsIgnoreCase(name)
                && String.valueOf(s.getDistrict()).equalsIgnoreCase(String.valueOf(district)));
        if (exists) throw ApiException.conflict("This school already exists.");
        School s = schools.save(new School(name, district));
        return new SchoolView(s.getId(), s.getName(), s.getDistrict(), List.of());
    }

    @Transactional
    public void updateSchool(Long id, SchoolInput in) {
        School s = schools.findById(id).orElseThrow(() -> ApiException.notFound("School"));
        s.setName(in.name().trim());
        s.setDistrict(blankToNull(in.district()));
    }

    @Transactional
    public void deleteSchool(Long id) {
        School s = schools.findById(id).orElseThrow(() -> ApiException.notFound("School"));
        if (classes.existsBySchoolId(id)) throw ApiException.conflict("Delete or move this school's classes first.");
        schools.delete(s);
    }

    @Transactional
    public ClassView createClass(ClassInput in) {
        Classroom c = new Classroom();
        c.setJoinCode(uniqueCode());
        c.setCreatedAt(Instant.now());
        apply(c, in);
        return view(classes.save(c));
    }

    @Transactional
    public ClassView updateClass(Long id, ClassInput in) {
        Classroom c = classes.findById(id).orElseThrow(() -> ApiException.notFound("Class"));
        apply(c, in);
        return view(c);
    }

    @Transactional
    public ClassView regenerateCode(Long id) {
        Classroom c = classes.findById(id).orElseThrow(() -> ApiException.notFound("Class"));
        c.setJoinCode(uniqueCode());
        return view(c);
    }

    @Transactional
    public void deleteClass(Long id) {
        Classroom c = classes.findById(id).orElseThrow(() -> ApiException.notFound("Class"));
        if (profiles.countByClassroomId(id) > 0) {
            throw ApiException.conflict("Move this class's students to another class before deleting it.");
        }
        assignments.deleteByClassroomId(id);
        classes.delete(c);
    }

    /** Admin placement of a student; null removes the student from their class. */
    @Transactional
    public void placeStudent(StudentProfile p, Long classId) {
        p.setClassroom(classId == null ? null : classes.findById(classId)
                .orElseThrow(() -> ApiException.badRequest("Selected class does not exist.")));
    }

    /** A deleted or demoted teacher leaves their classes without a teacher (students keep their class). */
    @Transactional
    public void releaseTeacher(Long teacherId) {
        classes.findByTeacherId(teacherId).forEach(c -> c.setTeacher(null));
    }

    // ------------------------------------------------------------------ teacher & student

    @Transactional(readOnly = true)
    public List<ClassView> classesOf(Long teacherId) {
        return classes.findByTeacherId(teacherId).stream().map(this::view).toList();
    }

    /** The teacher's own class, or 404 (never reveals other teachers' classes). */
    @Transactional(readOnly = true)
    public Classroom ownClass(Long teacherId, Long classId) {
        return classes.findById(classId)
                .filter(c -> c.getTeacher() != null && c.getTeacher().getId().equals(teacherId))
                .orElseThrow(() -> ApiException.notFound("Class"));
    }

    @Transactional
    public Classroom join(Long studentId, String joinCode) {
        Classroom c = classes.findByJoinCodeIgnoreCase(joinCode.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INVALID_CLASS_CODE",
                        "No class has this code. Check it with your teacher."));
        StudentProfile p = profiles.findByUserId(studentId).orElseThrow(() -> ApiException.notFound("Student profile"));
        p.setClassroom(c);
        if (p.getSchool() == null) {
            p.setSchool(c.getSchool().getName());
            if (p.getDistrict() == null) p.setDistrict(c.getSchool().getDistrict());
        }
        return c;
    }

    // ------------------------------------------------------------------ helpers

    private void apply(Classroom c, ClassInput in) {
        c.setSchool(schools.findById(in.schoolId()).orElseThrow(() -> ApiException.badRequest("Selected school does not exist.")));
        c.setName(in.name().trim());
        c.setGradeLevel(in.gradeLevel());
        c.setTeacher(in.teacherId() == null ? null : users.findById(in.teacherId())
                .filter(u -> u.getRole() == Role.TEACHER)
                .orElseThrow(() -> ApiException.badRequest("Selected teacher does not exist.")));
    }

    private String uniqueCode() {
        for (int i = 0; i < 20; i++) {
            String code = Classroom.newJoinCode();
            if (!classes.existsByJoinCode(code)) return code;
        }
        throw new IllegalStateException("Could not generate a unique class code");
    }

    private ClassView view(Classroom c) {
        User t = c.getTeacher();
        return new ClassView(c.getId(), c.getSchool().getId(), c.getSchool().getName(), c.getSchool().getDistrict(),
                c.getName(), c.getGradeLevel(), t == null ? null : t.getId(), t == null ? null : t.getName(),
                c.getJoinCode(), profiles.countByClassroomId(c.getId()));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
