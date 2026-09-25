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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Lesson and quiz content follows the app language (Accept-Language), falling back to English. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"dev", "test"})
class ContentLocalizationTest {

    @Autowired
    MockMvc mvc;

    @Autowired
    ObjectMapper json;

    private static final Map<String, int[]> SCRIPT = Map.of(
            "hi", new int[]{0x0900, 0x097F}, "or", new int[]{0x0B00, 0x0B7F}, "te", new int[]{0x0C00, 0x0C7F});

    @Test
    void lessonsSubjectsAndQuizzesAreServedInTheRequestedLanguage() throws Exception {
        String token = student();
        for (String lang : List.of("hi", "or", "te")) {
            JsonNode lesson = get("/api/lessons/1", token, lang);
            assertThat(lesson.get("language").asText()).isEqualTo(lang);
            assertThat(inScript(lesson.get("content").asText(), lang)).as(lang + " lesson body").isTrue();
            assertThat(inScript(lesson.get("title").asText(), lang)).isTrue();

            JsonNode subjects = get("/api/subjects", token, lang);
            assertThat(inScript(subjects.get(0).get("name").asText(), lang)).as(lang + " subject name").isTrue();

            JsonNode quiz = get("/api/quizzes/1", token, lang);
            assertThat(quiz.get("language").asText()).isEqualTo(lang);
            assertThat(inScript(quiz.at("/questions/0/prompt").asText(), lang)).isTrue();
            assertThat(quiz.at("/questions/0/correctIndex").isMissingNode()).isTrue();
        }
        // Region subtags and quality lists are understood
        assertThat(get("/api/lessons/1", token, "hi-IN,en;q=0.8").get("language").asText()).isEqualTo("hi");
    }

    @Test
    void unsupportedOrMissingLanguagesFallBackToEnglish() throws Exception {
        String token = student();
        JsonNode english = get("/api/lessons/1", token, null);
        assertThat(english.get("language").asText()).isEqualTo("en");
        assertThat(get("/api/lessons/1", token, "fr").get("content").asText()).isEqualTo(english.get("content").asText());
        assertThat(english.get("title").asText()).isEqualTo("Solving Linear Equations");
    }

    @Test
    void optionOrderAndGradingAreTheSameInEveryLanguage() throws Exception {
        String token = student();
        JsonNode en = get("/api/quizzes/1", token, "en");
        JsonNode hi = get("/api/quizzes/1", token, "hi");
        assertThat(hi.get("questions").size()).isEqualTo(en.get("questions").size());
        for (int i = 0; i < en.get("questions").size(); i++) {
            assertThat(hi.at("/questions/" + i + "/id").asLong()).isEqualTo(en.at("/questions/" + i + "/id").asLong());
            assertThat(hi.at("/questions/" + i + "/options").size()).isEqualTo(en.at("/questions/" + i + "/options").size());
        }
        // A purely symbolic option is identical in both languages ("x = 5")
        assertThat(hi.at("/questions/0/options/0").asText()).isEqualTo(en.at("/questions/0/options/0").asText());

        List<Map<String, Object>> answers = new ArrayList<>();
        en.get("questions").forEach(q -> answers.add(Map.of("questionId", q.get("id").asLong(), "selectedIndex", 0)));
        String body = json.writeValueAsString(Map.of("answers", answers, "clientAttemptId", UUID.randomUUID().toString()));
        JsonNode result = json.readTree(mvc.perform(post("/api/quizzes/1/submit").header("Authorization", "Bearer " + token)
                        .header("Accept-Language", "te").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(inScript(result.at("/questions/0/prompt").asText(), "te")).isTrue();
        assertThat(inScript(result.get("quizTitle").asText(), "te")).isTrue();
        // The same attempt read back in English
        JsonNode again = get("/api/students/me/attempts/" + result.get("attemptId").asLong(), token, "en");
        assertThat(again.get("correctCount").asInt()).isEqualTo(result.get("correctCount").asInt());
        assertThat(again.at("/questions/0/prompt").asText()).isEqualTo(en.at("/questions/0/prompt").asText());
    }

    // ------------------------------------------------------------------ helpers

    private static boolean inScript(String text, String lang) {
        int[] range = SCRIPT.get(lang);
        long letters = text.codePoints().filter(Character::isLetter).count();
        long native_ = text.codePoints().filter(c -> c >= range[0] && c <= range[1]).count();
        return letters > 0 && native_ * 2 >= letters;
    }

    private JsonNode get(String url, String token, String language) throws Exception {
        var req = org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get(url)
                .header("Authorization", "Bearer " + token);
        if (language != null) req.header("Accept-Language", language);
        return json.readTree(mvc.perform(req).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private String student() throws Exception {
        String email = "lang-" + UUID.randomUUID() + "@example.com";
        return json.readTree(mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "Lang Tester", "email", email, "password", "password123"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("token").asText();
    }
}
