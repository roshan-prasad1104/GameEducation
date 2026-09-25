package com.shikshasetu.teacher;

import com.shikshasetu.security.CurrentUser;
import com.shikshasetu.teacher.TeacherDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
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

    /** One row per student: the roster with performance and support segment. */
    @GetMapping("/reports/students.csv")
    public ResponseEntity<byte[]> studentsCsv() {
        List<List<?>> rows = teacher.students(CurrentUser.id()).stream().<List<?>>map(s -> Arrays.asList(
                s.id(), s.name(), s.email(), s.gradeLevel(), s.xp(), s.level(), s.streak(), s.lessonsCompleted(),
                s.quizAttempts(), s.averageScore(), s.lastActive(), s.activeDays(), s.segment(), s.weakestTopic())).toList();
        return CsvReport.of("class-students.csv", List.of("student_id", "name", "email", "grade", "xp", "level",
                "streak_days", "lessons_completed", "quiz_attempts", "average_score_pct", "last_active",
                "active_days_14d", "segment", "weakest_topic"), rows);
    }

    /** One row per topic: answer accuracy across the class. */
    @GetMapping("/reports/topics.csv")
    public ResponseEntity<byte[]> topicsCsv() {
        List<List<?>> rows = teacher.weakTopics(CurrentUser.id()).stream().<List<?>>map(t -> Arrays.asList(
                t.subjectName(), t.topic(), t.topicName(), t.answered(), t.correct(), t.accuracy(),
                t.studentsStruggling(), t.lessonTitle())).toList();
        return CsvReport.of("class-topics.csv", List.of("subject", "topic_code", "topic", "answers", "correct",
                "accuracy_pct", "students_struggling", "remedial_lesson"), rows);
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
