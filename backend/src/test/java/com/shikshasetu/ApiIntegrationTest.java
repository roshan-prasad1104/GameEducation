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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Exercises the real HTTP API end to end on an in-memory database with the demo seed:
 * authentication, role-based access, the student learning loop, gamification,
 * idempotent offline sync, recommendations (Java fallback) and teacher/admin endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"dev", "test"})
class ApiIntegrationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private String login(String email, String password) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("token").asText();
    }

    private JsonNode getJson(String url, String token) throws Exception {
        return json.readTree(mvc.perform(get(url).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private ResultActions postJson(String url, String token, Object body) throws Exception {
        return mvc.perform(post(url).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    @Test
    void authenticationAndRoleBasedAccessAreEnforcedByTheBackend() throws Exception {
        mvc.perform(get("/api/subjects")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"aarav@shiksha.org\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));

        String student = login("aarav@shiksha.org", "Student@123");
        String teacher = login("teacher@shiksha.org", "Teacher@123");
        String admin = login("admin@shiksha.org", "Admin@123");

        mvc.perform(get("/api/teacher/overview").header("Authorization", "Bearer " + student)).andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/stats").header("Authorization", "Bearer " + teacher)).andExpect(status().isForbidden());
        mvc.perform(get("/api/students/me/dashboard").header("Authorization", "Bearer " + admin)).andExpect(status().isForbidden());
        mvc.perform(post("/api/lessons/1/complete").header("Authorization", "Bearer " + teacher)).andExpect(status().isForbidden());
        mvc.perform(get("/api/subjects").header("Authorization", "Bearer invalid.token.here")).andExpect(status().isUnauthorized());
    }

    @Test
    void publicRegistrationAlwaysCreatesAStudent() throws Exception {
        String email = "new-" + UUID.randomUUID() + "@example.com";
        String body = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "New Kid", "email", email,
                                "password", "password123", "role", "ADMIN"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        JsonNode user = json.readTree(body).get("user");
        assertThat(user.get("role").asText()).isEqualTo("STUDENT");
        assertThat(user.get("onboarded").asBoolean()).isFalse();

        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Dup", "email", email, "password", "password123"))))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"x\",\"email\":\"bad\",\"password\":\"123\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    @Test
    void studentLearningLoopAwardsXpBadgesAndIsIdempotent() throws Exception {
        String email = "loop-" + UUID.randomUUID() + "@example.com";
        String token = json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Loop Tester", "email", email, "password", "password123"))))
                .andReturn().getResponse().getContentAsString()).get("token").asText();

        // Browse: subjects → subject → chapter
        JsonNode subjects = getJson("/api/subjects", token);
        assertThat(subjects.size()).isEqualTo(5);
        long subjectId = subjects.get(0).get("id").asLong();
        long chapterId = getJson("/api/subjects/" + subjectId, token).get("chapters").get(0).get("id").asLong();
        JsonNode chapter = getJson("/api/chapters/" + chapterId, token);
        long lessonId = chapter.get("lessons").get(0).get("id").asLong();
        long quizId = chapter.get("quiz").get("id").asLong();

        // Complete a lesson: +20 XP, FIRST_LESSON badge, daily mission
        JsonNode done = json.readTree(mvc.perform(post("/api/lessons/" + lessonId + "/complete").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(done.get("alreadyCompleted").asBoolean()).isFalse();
        assertThat(done.at("/reward/xpEarned").asInt()).isEqualTo(20 + 15);
        assertThat(done.at("/reward/newBadges/0/code").asText()).isEqualTo("FIRST_LESSON");
        assertThat(done.at("/reward/streak").asInt()).isEqualTo(1);

        JsonNode again = json.readTree(mvc.perform(post("/api/lessons/" + lessonId + "/complete").header("Authorization", "Bearer " + token))
                .andReturn().getResponse().getContentAsString());
        assertThat(again.get("alreadyCompleted").asBoolean()).isTrue();

        // Quiz questions never expose the answer up front
        JsonNode quiz = getJson("/api/quizzes/" + quizId, token);
        assertThat(quiz.at("/questions/0/correctIndex").isMissingNode()).isTrue();

        // Per-question check gives instant feedback without storing anything
        long firstQuestion = quiz.at("/questions/0/id").asLong();
        JsonNode check = json.readTree(postJson("/api/quizzes/" + quizId + "/check", token,
                Map.of("questionId", firstQuestion, "selectedIndex", 0)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(check.has("correct")).isTrue();
        assertThat(check.get("correctIndex").isInt()).isTrue();

        // /auth/me carries live gamification state for the sidebar
        JsonNode me = getJson("/api/auth/me", token);
        assertThat(me.get("xp").asInt()).isEqualTo(35);
        assertThat(me.get("streak").asInt()).isEqualTo(1);

        // Submit answering option 0 everywhere; grading happens server side
        List<Map<String, Object>> answers = new ArrayList<>();
        quiz.get("questions").forEach(q -> answers.add(Map.of("questionId", q.get("id").asLong(), "selectedIndex", 0)));
        String clientId = UUID.randomUUID().toString();
        Map<String, Object> submission = Map.of("answers", answers, "timeTakenSeconds", 60, "clientAttemptId", clientId);
        JsonNode result = json.readTree(postJson("/api/quizzes/" + quizId + "/submit", token, submission)
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        int correct = result.get("correctCount").asInt();
        assertThat(result.get("totalQuestions").asInt()).isEqualTo(quiz.get("questions").size());
        assertThat(result.at("/questions/0/correctIndex").isInt()).isTrue();
        assertThat(result.at("/reward/newBadges").toString()).contains("QUIZ_STARTER");
        assertThat(result.get("xpEarned").asInt()).isGreaterThanOrEqualTo(correct * 10 + 20);

        // Replaying the same offline submission returns the same attempt without extra XP
        int xpAfterFirst = getJson("/api/students/me/xp", token).get("totalXp").asInt();
        JsonNode replay = json.readTree(postJson("/api/quizzes/" + quizId + "/submit", token, submission)
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(replay.get("duplicate").asBoolean()).isTrue();
        assertThat(replay.get("attemptId").asLong()).isEqualTo(result.get("attemptId").asLong());
        assertThat(getJson("/api/students/me/xp", token).get("totalXp").asInt()).isEqualTo(xpAfterFirst);

        // Dashboard, progress and badges reflect the activity
        JsonNode dash = getJson("/api/students/me/dashboard", token);
        assertThat(dash.get("lessonsCompleted").asInt()).isEqualTo(1);
        assertThat(dash.get("quizzesTaken").asInt()).isEqualTo(1);
        assertThat(dash.at("/level/xp").asInt()).isEqualTo(xpAfterFirst);
        assertThat(getJson("/api/students/me/progress", token).get("attempts").size()).isEqualTo(1);

        // Leaderboard scopes
        assertThat(getJson("/api/students/me/leaderboard?scope=week", token).get("me").get("xp").asInt()).isGreaterThan(0);
        assertThat(getJson("/api/students/me/leaderboard?scope=class", token).get("entries").size()).isGreaterThan(1);
        assertThat(getJson("/api/catalog/outline", token).size()).isEqualTo(5);

        // Recommendations work even with the AI service down (Java fallback)
        JsonNode recs = getJson("/api/students/me/recommendations", token);
        assertThat(recs.get("source").asText()).isEqualTo("fallback");
        assertThat(recs.get("recommendations").size()).isGreaterThan(0);
    }

    @Test
    void teacherAndAdminEndpointsReturnRealAggregates() throws Exception {
        String teacher = login("teacher@shiksha.org", "Teacher@123");
        JsonNode overview = getJson("/api/teacher/overview", teacher);
        assertThat(overview.get("totalStudents").asInt()).isGreaterThanOrEqualTo(8);
        assertThat(overview.get("quizAttempts").asInt()).isGreaterThan(0);
        assertThat(overview.get("segmentModel").asText()).isEqualTo("fallback-rules");
        assertThat(getJson("/api/teacher/students", teacher).size()).isGreaterThanOrEqualTo(8);

        postJson("/api/teacher/assignments", teacher, Map.of("title", "Both set")).andExpect(status().isBadRequest());

        String admin = login("admin@shiksha.org", "Admin@123");
        JsonNode stats = getJson("/api/admin/stats", admin);
        assertThat(stats.get("lessons").asInt()).isEqualTo(30);
        assertThat(stats.get("questions").asInt()).isEqualTo(90);
        assertThat(stats.get("aiServiceUp").asBoolean()).isFalse();

        // Content with student history cannot be deleted (lesson 1 is completed by seeded students)
        mvc.perform(delete("/api/admin/lessons/1").header("Authorization", "Bearer " + admin))
                .andExpect(status().isConflict());
    }
}
