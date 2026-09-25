package com.shikshasetu;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The answer key must never reach a student before their answer is final: quiz payloads carry no
 * answers, instant feedback is only given for a locked answer, locked answers cannot be changed
 * (online or through an offline-style submission) and the score is always computed on the server.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"dev", "test"})
class QuizSecurityTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    long chapterId;
    long quizId;
    JsonNode questions;          // student view (no answers)
    List<Integer> answerKey;     // from the admin API

    @BeforeEach
    void loadQuiz() throws Exception {
        String admin = login("admin@shiksha.org", "Admin@123");
        chapterId = 2;
        quizId = getJson("/api/chapters/" + chapterId, admin).at("/quiz/id").asLong();
        JsonNode adminQuiz = getJson("/api/admin/quizzes/" + quizId, admin);
        answerKey = new ArrayList<>();
        adminQuiz.get("questions").forEach(q -> answerKey.add(q.get("correctIndex").asInt()));
        questions = getJson("/api/quizzes/" + quizId, admin).get("questions");
    }

    @Test
    void quizPayloadsNeverContainTheAnswerKey() throws Exception {
        String student = newStudent();
        for (String url : List.of("/api/quizzes/" + quizId, "/api/chapters/" + chapterId + "/offline-bundle")) {
            String body = mvc.perform(get(url).header("Authorization", "Bearer " + student))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            assertThat(body).doesNotContain("\"correctIndex\"").doesNotContain("\"explanation\"").doesNotContain("\"correct\"");
        }
        // The old stateless checker is gone
        postJson("/api/quizzes/" + quizId + "/check", student, Map.of("questionId", qid(0), "selectedIndex", 0))
                .andExpect(status().isNotFound());
    }

    @Test
    void feedbackRequiresAnOpenSessionAndLocksTheFirstAnswer() throws Exception {
        String student = newStudent();
        postJson("/api/quizzes/" + quizId + "/session/answers", student, Map.of("questionId", qid(0), "selectedIndex", 0))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("NO_ACTIVE_SESSION"));

        JsonNode session = start(student);
        assertThat(session.get("answers").size()).isZero();

        int wrong = (answerKey.get(0) + 1) % 4;
        JsonNode first = answer(student, qid(0), wrong);
        assertThat(first.get("correct").asBoolean()).isFalse();
        assertThat(first.get("correctIndex").asInt()).isEqualTo(answerKey.get(0));
        assertThat(first.get("alreadyAnswered").asBoolean()).isFalse();

        // Knowing the answer now, trying again does not change the locked answer
        JsonNode retry = answer(student, qid(0), answerKey.get(0));
        assertThat(retry.get("alreadyAnswered").asBoolean()).isTrue();
        assertThat(retry.get("selectedIndex").asInt()).isEqualTo(wrong);
        assertThat(retry.get("correct").asBoolean()).isFalse();

        // Restarting (e.g. after a reload) resumes the same session with the locked answer
        JsonNode resumed = start(student);
        assertThat(resumed.get("sessionId").asLong()).isEqualTo(session.get("sessionId").asLong());
        assertThat(resumed.at("/answers/0/selectedIndex").asInt()).isEqualTo(wrong);

        // Out-of-range options and questions from other quizzes are rejected
        postJson("/api/quizzes/" + quizId + "/session/answers", student, Map.of("questionId", qid(1), "selectedIndex", 9))
                .andExpect(status().isBadRequest());
        postJson("/api/quizzes/" + quizId + "/session/answers", student, Map.of("questionId", 999999, "selectedIndex", 0))
                .andExpect(status().isNotFound());
    }

    @Test
    void submitGradesTheLockedAnswersOnTheServer() throws Exception {
        String student = newStudent();
        start(student);
        int wrong = (answerKey.get(0) + 1) % 4;
        answer(student, qid(0), wrong);

        // The submission claims the right answer for question 1 and for every other question
        JsonNode result = submit(student, allCorrect(), false);
        assertThat(result.at("/questions/0/selectedIndex").asInt()).isEqualTo(wrong);
        assertThat(result.at("/questions/0/correct").asBoolean()).isFalse();
        assertThat(result.get("correctCount").asInt()).isEqualTo(answerKey.size() - 1);

        // The session is closed: a new one starts empty
        JsonNode next = start(student);
        assertThat(next.get("answers").size()).isZero();
    }

    @Test
    void offlineStyleSubmissionCannotOverrideLockedAnswers() throws Exception {
        String student = newStudent();
        start(student);
        int wrong = (answerKey.get(1) + 1) % 4;
        answer(student, qid(1), wrong);

        JsonNode result = submit(student, allCorrect(), true);
        assertThat(result.at("/questions/1/selectedIndex").asInt()).isEqualTo(wrong);
        assertThat(result.get("correctCount").asInt()).isEqualTo(answerKey.size() - 1);
    }

    @Test
    void sessionsArePerStudentAndStudentOnly() throws Exception {
        String a = newStudent();
        String b = newStudent();
        JsonNode sa = start(a);
        answer(a, qid(0), 0);
        JsonNode sb = start(b);
        assertThat(sb.get("sessionId").asLong()).isNotEqualTo(sa.get("sessionId").asLong());
        assertThat(sb.get("answers").size()).isZero();

        String teacher = login("teacher@shiksha.org", "Teacher@123");
        String admin = login("admin@shiksha.org", "Admin@123");
        for (String token : List.of(teacher, admin)) {
            mvc.perform(post("/api/quizzes/" + quizId + "/session").header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
            postJson("/api/quizzes/" + quizId + "/session/answers", token, Map.of("questionId", qid(0), "selectedIndex", 0))
                    .andExpect(status().isForbidden());
            postJson("/api/quizzes/" + quizId + "/submit", token, Map.of("answers", List.of()))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(post("/api/quizzes/" + quizId + "/session")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/quizzes/" + quizId + "/submit").contentType(MediaType.APPLICATION_JSON).content("{\"answers\":[]}"))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------------------ helpers

    private long qid(int i) {
        return questions.get(i).get("id").asLong();
    }

    private List<Map<String, Object>> allCorrect() {
        List<Map<String, Object>> answers = new ArrayList<>();
        for (int i = 0; i < answerKey.size(); i++) answers.add(Map.of("questionId", qid(i), "selectedIndex", answerKey.get(i)));
        return answers;
    }

    private JsonNode start(String token) throws Exception {
        return json.readTree(mvc.perform(post("/api/quizzes/" + quizId + "/session").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private JsonNode answer(String token, long questionId, int index) throws Exception {
        return json.readTree(postJson("/api/quizzes/" + quizId + "/session/answers", token,
                Map.of("questionId", questionId, "selectedIndex", index))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private JsonNode submit(String token, List<Map<String, Object>> answers, boolean offline) throws Exception {
        return json.readTree(postJson("/api/quizzes/" + quizId + "/submit", token, Map.of("answers", answers,
                "clientAttemptId", UUID.randomUUID().toString(), "offline", offline))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private String newStudent() throws Exception {
        String email = "quiz-" + UUID.randomUUID() + "@example.com";
        return json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Quiz Tester", "email", email, "password", "password123"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asText();
    }

    private String login(String email, String password) throws Exception {
        return json.readTree(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("token").asText();
    }

    private JsonNode getJson(String url, String token) throws Exception {
        return json.readTree(mvc.perform(get(url).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private ResultActions postJson(String url, String token, Object body) throws Exception {
        return mvc.perform(post(url).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }
}
