package com.shikshasetu.teacher;

import com.shikshasetu.security.CurrentUser;
import com.shikshasetu.teacher.TeacherDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Secured to ROLE_TEACHER; every query is scoped to the teacher's own students. */
@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
public class TeacherController {
    private final TeacherService teacher;

    @GetMapping("/overview")
    public Overview overview() {
        return teacher.overview(CurrentUser.id());
    }

    @GetMapping("/students")
    public List<StudentRow> students() {
        return teacher.students(CurrentUser.id());
    }

    @GetMapping("/students/{id}")
    public StudentDetail student(@PathVariable Long id) {
        return teacher.student(CurrentUser.id(), id);
    }

    @GetMapping("/weak-topics")
    public List<TopicStat> weakTopics() {
        return teacher.weakTopics(CurrentUser.id());
    }

    @GetMapping("/assignments")
    public List<AssignmentView> assignments() {
        return teacher.assignments(CurrentUser.id());
    }

    @PostMapping("/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public AssignmentView create(@Valid @RequestBody CreateAssignmentRequest req) {
        return teacher.createAssignment(CurrentUser.get(), req);
    }

    @DeleteMapping("/assignments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        teacher.deleteAssignment(CurrentUser.id(), id);
    }
}
