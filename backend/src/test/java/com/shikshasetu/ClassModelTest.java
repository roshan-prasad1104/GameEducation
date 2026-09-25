package com.shikshasetu;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Admin → school → class → teacher → students. Teachers only see and assign work to students in
 * the classes they teach; students join with a class code; only admins manage schools and classes.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"dev", "test"})
class ClassModelTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Test
    void teachersOnlySeeAndAssignWithinTheirOwnClasses() throws Exception {
        String admin = login("admin@shiksha.org", "Admin@123");
        String sunita = login("teacher@shiksha.org", "Teacher@123");
        long sunitaClass = body(send(get("/api/teacher/classes"), sunita, null)).at("/0/id").asLong();
        long aarav = body(send(get("/api/teacher/students"), sunita, null)).at("/0/id").asLong(); // one of Sunita's students

        // Admin creates a second teacher, a school and a class for them
        String email = "t-" + UUID.randomUUID() + "@example.com";
        long ravi = body(send(post("/api/admin/users"), admin, Map.of("name", "Ravi Teacher", "email", email,
                "password", "Teacher@123", "role", "TEACHER")).andExpect(status().isCreated())).get("id").asLong();
        String raviToken = login(email, "Teacher@123");
        long school = body(send(post("/api/admin/schools"), admin, Map.of("name", "Model School " + UUID.randomUUID(),
                "district", "Koraput")).andExpect(status().isCreated())).get("id").asLong();
        JsonNode raviClass = body(send(post("/api/admin/classes"), admin, Map.of("schoolId", school,
                "name", "Class 7 – Section B", "gradeLevel", 7, "teacherId", ravi)).andExpect(status().isCreated()));
        assertThat(raviClass.get("joinCode").asText()).matches("[A-HJKMNP-Z2-9]{6}");

        // A new student joins Ravi's class during onboarding with the class code
        String student = register();
        JsonNode me = body(send(put("/api/students/me/onboarding"), student, Map.of("gradeLevel", 7,
                "preferredLanguage", "te", "classCode", raviClass.get("joinCode").asText())).andExpect(status().isOk()));
        assertThat(me.get("className").asText()).isEqualTo("Class 7 – Section B");
        assertThat(me.get("teacherName").asText()).isEqualTo("Ravi Teacher");
        long studentId = me.get("id").asLong();

        // Ravi sees exactly that student; Sunita does not, and neither sees the other's students
        assertThat(body(send(get("/api/teacher/overview"), raviToken, null)).get("totalStudents").asInt()).isEqualTo(1);
        send(get("/api/teacher/students/" + studentId), raviToken, null).andExpect(status().isOk());
        send(get("/api/teacher/students/" + studentId), sunita, null).andExpect(status().isNotFound());
        send(get("/api/teacher/students/" + aarav), raviToken, null).andExpect(status().isNotFound());
        assertThat(body(send(get("/api/teacher/students"), sunita, null)).toString()).doesNotContain("\"id\":" + studentId + ",");
        send(get("/api/teacher/overview?classId=" + sunitaClass), raviToken, null).andExpect(status().isNotFound());
        send(get("/api/teacher/reports/students.csv?classId=" + sunitaClass), raviToken, null).andExpect(status().isNotFound());

        // Assignments stay inside the class
        String lessonBody = "{\"title\":\"Class 7 homework\",\"lessonId\":1}";
        send(post("/api/teacher/assignments"), raviToken, lessonBody).andExpect(status().isCreated());
        send(post("/api/teacher/assignments"), raviToken, Map.of("title", "Not mine", "lessonId", 1, "studentId", aarav))
                .andExpect(status().isNotFound());
        send(post("/api/teacher/assignments"), raviToken, Map.of("title", "Not mine", "lessonId", 1, "classId", sunitaClass))
                .andExpect(status().isNotFound());
        assertThat(body(send(get("/api/students/me/assignments"), student, null)).toString()).contains("Class 7 homework");
        String aaravToken = login("aarav@shiksha.org", "Student@123");
        assertThat(body(send(get("/api/students/me/assignments"), aaravToken, null)).toString()).doesNotContain("Class 7 homework");

        // With two classes a whole-class assignment must name the class
        body(send(post("/api/admin/classes"), admin, Map.of("schoolId", school, "name", "Class 7 – Section C",
                "teacherId", ravi)).andExpect(status().isCreated()));
        send(post("/api/teacher/assignments"), raviToken, lessonBody).andExpect(status().isBadRequest());
        send(post("/api/teacher/assignments"), raviToken, Map.of("title", "Targeted", "lessonId", 1,
                "classId", raviClass.get("id").asLong())).andExpect(status().isCreated());

        // An admin moves the student to Sunita's class: now she sees them and Ravi does not
        send(put("/api/admin/users/" + studentId), admin, Map.of("name", "Class Mover", "active", true,
                "gradeLevel", 7, "classId", sunitaClass)).andExpect(status().isOk());
        send(get("/api/teacher/students/" + studentId), sunita, null).andExpect(status().isOk());
        send(get("/api/teacher/students/" + studentId), raviToken, null).andExpect(status().isNotFound());
    }

    @Test
    void onlyAdminsManageSchoolsAndClassesAndCodesMustBeValid() throws Exception {
        String admin = login("admin@shiksha.org", "Admin@123");
        String teacher = login("teacher@shiksha.org", "Teacher@123");
        String student = register();

        send(get("/api/admin/schools"), teacher, null).andExpect(status().isForbidden());
        send(post("/api/admin/classes"), teacher, Map.of("schoolId", 1, "name", "X")).andExpect(status().isForbidden());
        send(get("/api/teacher/classes"), student, null).andExpect(status().isForbidden());
        send(put("/api/students/me/class"), teacher, Map.of("joinCode", "ABCDEF")).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/schools")).andExpect(status().isUnauthorized());

        send(put("/api/students/me/class"), student, Map.of("joinCode", "NOPE99"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("INVALID_CLASS_CODE"));

        // Classes with students and schools with classes cannot be deleted
        JsonNode schools = body(send(get("/api/admin/schools"), admin, null));
        JsonNode demoSchool = schools.findParents("classes").stream()
                .filter(s -> s.get("classes").size() > 0 && s.at("/classes/0/studentCount").asInt() > 0).findFirst().orElseThrow();
        send(delete("/api/admin/classes/" + demoSchool.at("/classes/0/id").asLong()), admin, null).andExpect(status().isConflict());
        send(delete("/api/admin/schools/" + demoSchool.get("id").asLong()), admin, null).andExpect(status().isConflict());

        // A new empty class can be deleted; regenerating a code invalidates the old one
        JsonNode created = body(send(post("/api/admin/classes"), admin, Map.of("schoolId", demoSchool.get("id").asLong(),
                "name", "Temp class")).andExpect(status().isCreated()));
        String oldCode = created.get("joinCode").asText();
        JsonNode regenerated = body(send(post("/api/admin/classes/" + created.get("id").asLong() + "/join-code"), admin, null));
        assertThat(regenerated.get("joinCode").asText()).isNotEqualTo(oldCode);
        send(put("/api/students/me/class"), student, Map.of("joinCode", oldCode)).andExpect(status().isNotFound());
        send(delete("/api/admin/classes/" + created.get("id").asLong()), admin, null).andExpect(status().isNoContent());
    }

    // ------------------------------------------------------------------ helpers

    private ResultActions send(MockHttpServletRequestBuilder req, String token, Object bodyValue) throws Exception {
        req.header("Authorization", "Bearer " + token);
        if (bodyValue != null) {
            req.contentType(MediaType.APPLICATION_JSON)
                    .content(bodyValue instanceof String s ? s : json.writeValueAsString(bodyValue));
        }
        return mvc.perform(req);
    }

    private JsonNode body(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsString());
    }

    private String login(String email, String password) throws Exception {
        return json.readTree(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("token").asText();
    }

    private String register() throws Exception {
        Map<String, Object> req = new HashMap<>(Map.of("name", "Class Tester", "password", "password123"));
        req.put("email", "cls-" + UUID.randomUUID() + "@example.com");
        return json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(req)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asText();
    }
}
