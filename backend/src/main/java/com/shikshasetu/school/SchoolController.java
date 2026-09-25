package com.shikshasetu.school;

import com.shikshasetu.school.SchoolDtos.*;
import com.shikshasetu.security.CurrentUser;
import com.shikshasetu.user.AuthDtos.UserView;
import com.shikshasetu.user.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The URL prefixes carry the role rules from SecurityConfig: /api/admin, /api/teacher, /api/students. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SchoolController {
    private final SchoolService schools;
    private final AuthService auth;

    @GetMapping("/admin/schools")
    public List<SchoolView> schools() {
        return schools.schoolsWithClasses();
    }

    @PostMapping("/admin/schools")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolView createSchool(@Valid @RequestBody SchoolInput in) {
        return schools.createSchool(in);
    }

    @PutMapping("/admin/schools/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateSchool(@PathVariable Long id, @Valid @RequestBody SchoolInput in) {
        schools.updateSchool(id, in);
    }

    @DeleteMapping("/admin/schools/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSchool(@PathVariable Long id) {
        schools.deleteSchool(id);
    }

    @PostMapping("/admin/classes")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassView createClass(@Valid @RequestBody ClassInput in) {
        return schools.createClass(in);
    }

    @PutMapping("/admin/classes/{id}")
    public ClassView updateClass(@PathVariable Long id, @Valid @RequestBody ClassInput in) {
        return schools.updateClass(id, in);
    }

    @PostMapping("/admin/classes/{id}/join-code")
    public ClassView regenerateCode(@PathVariable Long id) {
        return schools.regenerateCode(id);
    }

    @DeleteMapping("/admin/classes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClass(@PathVariable Long id) {
        schools.deleteClass(id);
    }

    @GetMapping("/teacher/classes")
    public List<ClassView> myClasses() {
        return schools.classesOf(CurrentUser.id());
    }

    @PutMapping("/students/me/class")
    public UserView joinClass(@Valid @RequestBody JoinClassRequest req) {
        schools.join(CurrentUser.id(), req.joinCode());
        return auth.me(CurrentUser.id());
    }
}
