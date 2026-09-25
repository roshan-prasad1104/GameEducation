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

    // classId (optional) narrows a view to one of the teacher's classes; without it all their classes count.

    @GetMapping("/overview")
    public Overview overview(@RequestParam(required = false) Long classId) {
        return teacher.overview(CurrentUser.id(), classId);
    }

    @GetMapping("/students")
    public List<StudentRow> students(@RequestParam(required = false) Long classId) {
        return teacher.students(CurrentUser.id(), classId);
    }

    @GetMapping("/students/{id}")
    public StudentDetail student(@PathVariable Long id) {
        return teacher.student(CurrentUser.id(), id);
    }

    @GetMapping("/weak-topics")
    public List<TopicStat> weakTopics(@RequestParam(required = false) Long classId) {
        return teacher.weakTopics(CurrentUser.id(), classId);
    }

    /** One row per student: the roster with performance and support segment. */
    @GetMapping("/reports/students.csv")
    public ResponseEntity<byte[]> studentsCsv(@RequestParam(required = false) Long classId) {
        List<List<?>> rows = teacher.students(CurrentUser.id(), classId).stream().<List<?>>map(s -> Arrays.asList(
                s.id(), s.name(), s.email(), s.gradeLevel(), s.xp(), s.level(), s.streak(), s.lessonsCompleted(),
                s.quizAttempts(), s.averageScore(), s.lastActive(), s.activeDays(), s.segment(), s.weakestTopic())).toList();
        return CsvReport.of("class-students.csv", List.of("student_id", "name", "email", "grade", "xp", "level",
                "streak_days", "lessons_completed", "quiz_attempts", "average_score_pct", "last_active",
                "active_days_14d", "segment", "weakest_topic"), rows);
    }

    /** One row per topic: answer accuracy across the class. */
    @GetMapping("/reports/topics.csv")
    public ResponseEntity<byte[]> topicsCsv(@RequestParam(required = false) Long classId) {
        List<List<?>> rows = teacher.weakTopics(CurrentUser.id(), classId).stream().<List<?>>map(t -> Arrays.asList(
                t.subjectName(), t.topic(), t.topicName(), t.answered(), t.correct(), t.accuracy(),
                t.studentsStruggling(), t.lessonTitle())).toList();
        return CsvReport.of("class-topics.csv", List.of("subject", "topic_code", "topic", "answers", "correct",
                "accuracy_pct", "students_struggling", "remedial_lesson"), rows);
    }

    @GetMapping("/assignments")
    public List<AssignmentView> assignments(@RequestParam(required = false) Long classId) {
        return teacher.assignments(CurrentUser.id(), classId);
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
