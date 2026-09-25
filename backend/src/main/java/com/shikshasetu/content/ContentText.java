package com.shikshasetu.content;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Curriculum text in the language of the current request (the {@code Accept-Language} header the
 * app sends with its UI language). Anything without a translation falls back to English, so a
 * partially translated course still works. Outside a request (seeding, jobs) English is used.
 */
public final class ContentText {
    public static final String ENGLISH = "en";
    public static final Set<String> LANGUAGES = Set.of("en", "hi", "or", "te");

    private ContentText() {}

    /** "hi" for "hi", "hi-IN" or "hi-IN,en;q=0.8"; English for anything unsupported. */
    public static String language() {
        if (!(RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs)) return ENGLISH;
        return parse(attrs.getRequest());
    }

    static String parse(HttpServletRequest request) {
        String header = request.getHeader("Accept-Language");
        if (header == null || header.isBlank()) return ENGLISH;
        String first = header.split(",")[0].split(";")[0].trim().toLowerCase(Locale.ROOT);
        String code = first.contains("-") ? first.substring(0, first.indexOf('-')) : first;
        return LANGUAGES.contains(code) ? code : ENGLISH;
    }

    private static <T> T in(java.util.Map<String, T> translations) {
        String lang = language();
        return lang.equals(ENGLISH) ? null : translations.get(lang);
    }

    // ------------------------------------------------------------------ subjects & chapters

    public static String name(Subject s) {
        Translations.SubjectText t = in(s.getTranslations());
        return t != null ? t.getName() : s.getName();
    }

    public static String description(Subject s) {
        Translations.SubjectText t = in(s.getTranslations());
        return t != null && t.getDescription() != null ? t.getDescription() : s.getDescription();
    }

    public static String title(Chapter c) {
        Translations.ChapterText t = in(c.getTranslations());
        return t != null ? t.getTitle() : c.getTitle();
    }

    public static String description(Chapter c) {
        Translations.ChapterText t = in(c.getTranslations());
        return t != null && t.getDescription() != null ? t.getDescription() : c.getDescription();
    }

    // ------------------------------------------------------------------ lessons

    public static String title(Lesson l) {
        Translations.LessonText t = in(l.getTranslations());
        return t != null ? t.getTitle() : l.getTitle();
    }

    public static String summary(Lesson l) {
        Translations.LessonText t = in(l.getTranslations());
        return t != null && t.getSummary() != null ? t.getSummary() : l.getSummary();
    }

    public static String content(Lesson l) {
        Translations.LessonText t = in(l.getTranslations());
        return t != null ? t.getContent() : l.getContent();
    }

    /** The language the lesson body is actually served in (differs from the request when it falls back). */
    public static String languageOf(Lesson l) {
        return in(l.getTranslations()) != null ? language() : ENGLISH;
    }

    // ------------------------------------------------------------------ quizzes

    public static String title(Quiz q) {
        Translations.QuizText t = in(q.getTranslations());
        return t != null ? t.getTitle() : q.getTitle();
    }

    public static String description(Quiz q) {
        Translations.QuizText t = in(q.getTranslations());
        return t != null && t.getDescription() != null ? t.getDescription() : q.getDescription();
    }

    public static String languageOf(Quiz q) {
        return in(q.getTranslations()) != null ? language() : ENGLISH;
    }

    public static String prompt(Question q) {
        Translations.QuestionText t = in(q.getTranslations());
        return t != null ? t.getPrompt() : q.getPrompt();
    }

    public static String explanation(Question q) {
        Translations.QuestionText t = in(q.getTranslations());
        return t != null && t.getExplanation() != null ? t.getExplanation() : q.getExplanation();
    }

    /** Translated options only when every option is translated, so the order always matches the answer key. */
    public static List<String> options(Question q) {
        String lang = language();
        List<String> english = List.copyOf(q.getOptions());
        if (lang.equals(ENGLISH)) return english;
        String[] out = new String[english.size()];
        for (Translations.OptionText o : q.getOptionTranslations()) {
            if (o.getLanguage().equals(lang) && o.getOptionIndex() >= 0 && o.getOptionIndex() < out.length) {
                out[o.getOptionIndex()] = o.getText();
            }
        }
        for (String s : out) if (s == null) return english;
        return List.of(out);
    }
}
