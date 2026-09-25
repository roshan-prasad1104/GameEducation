package com.shikshasetu.seed;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shikshasetu.common.AppProperties;
import com.shikshasetu.content.*;
import com.shikshasetu.content.Translations.*;
import com.shikshasetu.seed.ContentSeed.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Loads the lesson/quiz translations in {@code seed/i18n/<lang>/<subject>.json} into the
 * translation tables, on new and existing databases alike (runs after {@link DataSeeder}).
 *
 * A translation file mirrors the English subject in {@code seed/content.json} position by position.
 * It is only applied to an item whose stored English text still equals the seed's English, so
 * content an admin has since edited is never paired with a stale translation, and existing
 * translations are never overwritten. Safe to run on every start.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class TranslationSeeder implements ApplicationRunner {
    static final List<String> LANGUAGES = List.of("hi", "or", "te");

    private final AppProperties props;
    private final SubjectRepository subjects;
    private final TransactionTemplate tx;

    record SubjectTr(String language, String subject, String name, String description, List<ChapterTr> chapters) {}

    record ChapterTr(String title, String description, List<LessonTr> lessons, QuizTr quiz) {}

    record LessonTr(String title, String summary, String content) {}

    record QuizTr(String title, String description, List<QuestionTr> questions) {}

    record QuestionTr(String prompt, List<String> options, String explanation) {}

    private int applied;
    private int skipped;

    @Override
    public void run(ApplicationArguments args) throws IOException {
        if (!props.seed().enabled()) return;
        ObjectMapper mapper = new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        ContentSeed english;
        try (InputStream in = new ClassPathResource("seed/content.json").getInputStream()) {
            english = mapper.readValue(in, ContentSeed.class);
        }
        applied = 0;
        skipped = 0;
        for (String lang : LANGUAGES) {
            for (SubjectSeed en : english.subjects()) {
                Resource file = new ClassPathResource("seed/i18n/" + lang + "/" + en.code() + ".json");
                if (!file.exists()) continue;
                SubjectTr tr;
                try (InputStream in = file.getInputStream()) {
                    tr = mapper.readValue(in, SubjectTr.class);
                }
                tx.executeWithoutResult(s -> subjects.findByCode(en.code()).ifPresent(subject -> apply(lang, en, tr, subject)));
            }
        }
        if (applied > 0 || skipped > 0) {
            log.info("Content translations: {} item(s) added, {} skipped because the English differs from the seed.",
                    applied, skipped);
        }
    }

    private void apply(String lang, SubjectSeed en, SubjectTr tr, Subject subject) {
        if (same(subject.getName(), en.name()) && !subject.getTranslations().containsKey(lang)) {
            subject.getTranslations().put(lang, new SubjectText(tr.name(), tr.description()));
            applied++;
        }
        List<Chapter> chapters = subject.getChapters().stream().sorted(Comparator.comparingInt(Chapter::getPosition)).toList();
        for (int ci = 0; ci < Math.min(chapters.size(), Math.min(en.chapters().size(), tr.chapters().size())); ci++) {
            Chapter chapter = chapters.get(ci);
            ChapterSeed ec = en.chapters().get(ci);
            ChapterTr tc = tr.chapters().get(ci);
            if (!same(chapter.getTitle(), ec.title())) {
                skipped++;
                continue;
            }
            if (!chapter.getTranslations().containsKey(lang)) {
                chapter.getTranslations().put(lang, new ChapterText(tc.title(), tc.description()));
                applied++;
            }
            List<Lesson> lessons = chapter.getLessons().stream().sorted(Comparator.comparingInt(Lesson::getPosition)).toList();
            for (int li = 0; li < Math.min(lessons.size(), Math.min(ec.lessons().size(), tc.lessons().size())); li++) {
                Lesson lesson = lessons.get(li);
                LessonSeed el = ec.lessons().get(li);
                LessonTr tl = tc.lessons().get(li);
                if (!same(lesson.getTitle(), el.title()) || !same(lesson.getContent(), el.content())) {
                    skipped++;
                } else if (!lesson.getTranslations().containsKey(lang)) {
                    lesson.getTranslations().put(lang, new LessonText(tl.title(), tl.summary(), tl.content()));
                    applied++;
                }
            }
            if (!chapter.getQuizzes().isEmpty() && ec.quiz() != null && tc.quiz() != null) {
                applyQuiz(lang, chapter.getQuizzes().getFirst(), ec.quiz(), tc.quiz());
            }
        }
    }

    private void applyQuiz(String lang, Quiz quiz, QuizSeed en, QuizTr tr) {
        if (!same(quiz.getTitle(), en.title())) {
            skipped++;
            return;
        }
        if (!quiz.getTranslations().containsKey(lang)) {
            quiz.getTranslations().put(lang, new QuizText(tr.title(), tr.description()));
            applied++;
        }
        List<Question> questions = quiz.getQuestions().stream().sorted(Comparator.comparingInt(Question::getPosition)).toList();
        for (int qi = 0; qi < Math.min(questions.size(), Math.min(en.questions().size(), tr.questions().size())); qi++) {
            Question q = questions.get(qi);
            QuestionSeed eq = en.questions().get(qi);
            QuestionTr tq = tr.questions().get(qi);
            boolean unchanged = same(q.getPrompt(), eq.prompt()) && q.getOptions().equals(eq.options())
                    && q.getCorrectIndex() == eq.correctIndex();
            if (!unchanged || tq.options() == null || tq.options().size() != q.getOptions().size()) {
                skipped++;
                continue;
            }
            if (q.getTranslations().containsKey(lang)) continue;
            q.getTranslations().put(lang, new QuestionText(tq.prompt(), tq.explanation()));
            for (int oi = 0; oi < tq.options().size(); oi++) {
                q.getOptionTranslations().add(new OptionText(lang, oi, tq.options().get(oi)));
            }
            applied++;
        }
    }

    private static boolean same(String stored, String seed) {
        return Objects.equals(stored == null ? null : stored.strip(), seed == null ? null : seed.strip());
    }
}
