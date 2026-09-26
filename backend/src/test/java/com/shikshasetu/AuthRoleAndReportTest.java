package com.shikshasetu;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.pdf.PdfReader;
import com.lowagie.text.pdf.parser.PdfTextExtractor;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Role-aware sign-in, public registration (students and teachers only), the single admin account,
 * and the per-student PDF report with its access rules.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"dev", "test"})
class AuthRoleAndReportTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private static final Map<String, String[]> DEMO = Map.of(
            "STUDENT", new String[]{"aarav@shiksha.org", "Student@123"},
            "TEACHER", new String[]{"teacher@shiksha.org", "Teacher@123"},
            "ADMIN", new String[]{"admin@shiksha.org", "Admin@123"});

    @Test
    void theSelectedRoleMustMatchTheAccount() throws Exception {
        for (String selected : List.of("STUDENT", "TEACHER", "ADMIN")) {
            for (var account : DEMO.entrySet()) {
                ResultActions r = loginAs(account.getValue()[0], account.getValue()[1], selected);
                if (selected.equals(account.getKey())) {
                    r.andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value(selected))
                            .andExpect(jsonPath("$.token").exists());
                } else {
                    r.andExpect(status().isUnauthorized())
                            .andExpect(jsonPath("$.code").value("ROLE_MISMATCH"))
                            .andExpect(jsonPath("$.token").doesNotExist());
                }
            }
        }
        // A wrong password never reveals the account's role
        loginAs("teacher@shiksha.org", "wrong-password", "STUDENT")
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
        // Clients that send no role still work; the stored role decides what they may do
        loginAs("teacher@shiksha.org", "Teacher@123", null).andExpect(status().isOk());
    }

    @Test
    void publicRegistrationAllowsStudentsAndTeachersButNeverAdmins() throws Exception {
        for (String forged : List.of("ADMIN", "admin", "SUPERUSER")) {
            register("forged-" + UUID.randomUUID() + "@example.com", forged).andExpect(status().isBadRequest());
        }

        JsonNode student = body(register("s-" + UUID.randomUUID() + "@example.com", "STUDENT").andExpect(status().isCreated()));
        assertThat(student.at("/user/role").asText()).isEqualTo("STUDENT");
        assertThat(student.at("/user/onboarded").asBoolean()).isFalse();

        JsonNode teacher = body(register("t-" + UUID.randomUUID() + "@example.com", "TEACHER").andExpect(status().isCreated()));
        assertThat(teacher.at("/user/role").asText()).isEqualTo("TEACHER");
        assertThat(teacher.at("/user/onboarded").isMissingNode() || teacher.at("/user/onboarded").isNull()).isTrue();
        String t = teacher.get("token").asText();
        // A self-registered teacher sees nothing until an admin gives them a class
        assertThat(body(authed(get("/api/teacher/classes"), t)).size()).isZero();
        assertThat(body(authed(get("/api/teacher/overview"), t)).get("totalStudents").asInt()).isZero();
        authed(get("/api/students/me/dashboard"), t).andExpect(status().isForbidden());
        authed(get("/api/admin/stats"), t).andExpect(status().isForbidden());

        // Admins cannot create another admin either; there is exactly one
        String admin = token("admin@shiksha.org", "Admin@123");
        authed(post("/api/admin/users"), admin, Map.of("name", "Second Admin", "email", "a2-" + UUID.randomUUID() + "@example.com",
                "password", "Admin@1234", "role", "ADMIN"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("ROLE_NOT_ALLOWED"));
        authed(post("/api/admin/users"), admin, Map.of("name", "Made By Admin", "email", "tt-" + UUID.randomUUID() + "@example.com",
                "password", "Teacher@123", "role", "TEACHER")).andExpect(status().isCreated());
        long admins = 0;
        for (JsonNode u : body(authed(get("/api/admin/users"), admin))) if (u.get("role").asText().equals("ADMIN")) admins++;
        assertThat(admins).isEqualTo(1);
    }

    @Test
    void studentReportIsARealPdfWithTheStudentsDataAndIsScoped() throws Exception {
        String teacher = token("teacher@shiksha.org", "Teacher@123");
        String admin = token("admin@shiksha.org", "Admin@123");
        String student = token("aarav@shiksha.org", "Student@123");
        long aarav = body(authed(get("/api/auth/me"), student)).get("id").asLong();

        MockHttpServletResponse res = authed(get("/api/teacher/students/" + aarav + "/report.pdf"), teacher)
                .andExpect(status().isOk()).andReturn().getResponse();
        assertThat(res.getContentType()).isEqualTo(MediaType.APPLICATION_PDF_VALUE);
        assertThat(res.getHeader("Content-Disposition")).contains("student-report-" + aarav + ".pdf");
        byte[] pdf = res.getContentAsByteArray();
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");

        PdfReader reader = new PdfReader(pdf);
        StringBuilder text = new StringBuilder();
        PdfTextExtractor extractor = new PdfTextExtractor(reader);
        for (int page = 1; page <= reader.getNumberOfPages(); page++) text.append(extractor.getTextFromPage(page)).append('\n');
        reader.close();
        String all = text.toString();
        assertThat(all).contains("Student Progress Report", "Aarav Sharma", "aarav@shiksha.org", "Class 8",
                "Govt. High School, Sundargarh", "Sunita Kullu", "Subject performance", "Mathematics", "Badges", "XP");

        // Admin: any student. Teacher: only their own. Students and anonymous users: never.
        authed(get("/api/admin/students/" + aarav + "/report.pdf"), admin).andExpect(status().isOk());
        authed(get("/api/teacher/students/" + aarav + "/report.pdf"), student).andExpect(status().isForbidden());
        authed(get("/api/admin/students/" + aarav + "/report.pdf"), teacher).andExpect(status().isForbidden());
        mvc.perform(get("/api/teacher/students/" + aarav + "/report.pdf")).andExpect(status().isUnauthorized());
        String otherTeacher = body(register("ot-" + UUID.randomUUID() + "@example.com", "TEACHER")).get("token").asText();
        authed(get("/api/teacher/students/" + aarav + "/report.pdf"), otherTeacher).andExpect(status().isNotFound());
        authed(get("/api/admin/students/999999/report.pdf"), admin).andExpect(status().isNotFound());
    }

    // ------------------------------------------------------------------ helpers

    private ResultActions loginAs(String email, String password, String role) throws Exception {
        Map<String, Object> req = new HashMap<>(Map.of("email", email, "password", password));
        if (role != null) req.put("role", role);
        return mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(req)));
    }

    private String token(String email, String password) throws Exception {
        return body(loginAs(email, password, null).andExpect(status().isOk())).get("token").asText();
    }

    private ResultActions register(String email, String role) throws Exception {
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(
                Map.of("name", "Role Tester", "email", email, "password", "password123", "role", role))));
    }

    private ResultActions authed(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req, String token)
            throws Exception {
        return mvc.perform(req.header("Authorization", "Bearer " + token));
    }

    private ResultActions authed(org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder req, String token,
                                 Object bodyValue) throws Exception {
        return mvc.perform(req.header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(bodyValue)));
    }

    private JsonNode body(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsString());
    }
}
