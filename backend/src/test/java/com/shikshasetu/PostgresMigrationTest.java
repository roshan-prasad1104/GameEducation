package com.shikshasetu;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Runs the {@code postgres} profile against a real PostgreSQL server (binaries started by
 * zonky embedded-postgres): Flyway applies the migrations, Hibernate validates the entities
 * against them, the demo seed loads, and the core learning loop writes through.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("postgres")
class PostgresMigrationTest {

    static final EmbeddedPostgres PG;

    static {
        try {
            PG = EmbeddedPostgres.start();
        } catch (IOException e) {
            throw new IllegalStateException("Could not start embedded PostgreSQL", e);
        }
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", () -> PG.getJdbcUrl("postgres", "postgres"));
        r.add("spring.datasource.username", () -> "postgres");
        r.add("spring.datasource.password", () -> "");
        r.add("app.jwt.secret", () -> "test-secret-test-secret-test-secret-123456");
        r.add("app.ai.base-url", () -> "http://localhost:1");
        r.add("app.ai.timeout-ms", () -> "300");
    }

    @AfterAll
    static void stop() throws IOException {
        PG.close();
    }

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void migrationsApplyAndTheLearningLoopWorksOnPostgres() throws Exception {
        assertThat(jdbc.queryForObject("select version()", String.class)).startsWith("PostgreSQL");
        assertThat(jdbc.queryForObject(
                "select count(*) from flyway_schema_history where version = '1' and success", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select count(*) from subjects", Integer.class)).isEqualTo(5);

        String email = "pg-" + UUID.randomUUID() + "@example.com";
        String token = json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "PG Tester", "email", email, "password", "password123"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asText();

        JsonNode chapter = getJson("/api/chapters/1", token);
        long lessonId = chapter.at("/lessons/0/id").asLong();
        long quizId = chapter.at("/quiz/id").asLong();
        mvc.perform(post("/api/lessons/" + lessonId + "/complete").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        JsonNode quiz = getJson("/api/quizzes/" + quizId, token);
        List<Map<String, Object>> answers = new ArrayList<>();
        quiz.get("questions").forEach(q -> answers.add(Map.of("questionId", q.get("id").asLong(), "selectedIndex", 0)));
        mvc.perform(post("/api/quizzes/" + quizId + "/submit").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("answers", answers, "clientAttemptId", UUID.randomUUID().toString()))))
                .andExpect(status().isOk());

        JsonNode dashboard = getJson("/api/students/me/dashboard", token);
        assertThat(dashboard.toString()).contains("\"lessonsCompleted\":1");
        assertThat(getJson("/api/auth/me", token).get("xp").asInt()).isGreaterThan(20);

        String teacher = json.readTree(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"teacher@shiksha.org\",\"password\":\"Teacher@123\"}"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("token").asText();
        assertThat(getJson("/api/teacher/overview", teacher).isObject()).isTrue();
    }

    private JsonNode getJson(String url, String token) throws Exception {
        return json.readTree(mvc.perform(get(url).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
}
