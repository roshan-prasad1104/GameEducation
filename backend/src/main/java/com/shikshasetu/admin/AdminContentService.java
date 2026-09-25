package com.shikshasetu.admin;

import com.shikshasetu.admin.AdminDtos.*;
import com.shikshasetu.ai.RecommendationRepository;
import com.shikshasetu.common.ApiException;
import com.shikshasetu.content.*;
import com.shikshasetu.learning.AttemptAnswerRepository;
import com.shikshasetu.learning.LessonProgressRepository;
import com.shikshasetu.learning.QuizAttemptRepository;
import com.shikshasetu.learning.QuizSessionAnswerRepository;
import com.shikshasetu.learning.QuizSessionRepository;
import com.shikshasetu.teacher.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Content management. Items that already have student history (completions or
 * attempts) cannot be deleted, so learning records are never silently lost.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminContentService {
    private final SubjectRepository subjects;
    private final ChapterRepository chapters;
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final QuestionRepository questions;
    private final LessonProgressRepository progress;
    private final QuizAttemptRepository attempts;
    private final AttemptAnswerRepository answers;
    private final QuizSessionRepository quizSessions;
    private final QuizSessionAnswerRepository sessionAnswers;
    private final AssignmentRepository assignments;
    private final RecommendationRepository recommendations;

    @Transactional(readOnly = true)
    public List<ContentSubject> tree() {
        return subjects.findAllByOrderByIdAsc().stream().map(s -> new ContentSubject(s.getId(), s.getCode(), s.getName(),
                s.getDescription(), s.getColor(), s.getIcon(), s.getGradeLevel(),
                s.getChapters().stream().map(c -> new ContentChapter(c.getId(), c.getTitle(), c.getDescription(), c.getPosition(),
                        c.getLessons().stream().map(l -> new ContentLesson(l.getId(), l.getTitle(), l.getTopic(),
                                l.getPosition(), l.getDurationMinutes())).toList(),
                        c.getQuizzes().stream().map(q -> new ContentQuiz(q.getId(), q.getTitle(), q.getQuestions().size(),
                                q.getTimeLimitSeconds())).toList())).toList())).toList();
    }

    // ------------------------------------------------------------------ subjects

    public ContentSubject createSubject(SubjectInput in) {
        subjects.findByCode(in.code()).ifPresent(s -> { throw ApiException.conflict("Subject code already exists."); });
        Subject s = new Subject();
        applySubject(s, in);
        subjects.save(s);
        return new ContentSubject(s.getId(), s.getCode(), s.getName(), s.getDescription(), s.getColor(), s.getIcon(),
                s.getGradeLevel(), List.of());
    }

    public void updateSubject(Long id, SubjectInput in) {
        Subject s = subjects.findById(id).orElseThrow(() -> ApiException.notFound("Subject"));
        subjects.findByCode(in.code()).filter(o -> !o.getId().equals(id))
                .ifPresent(o -> { throw ApiException.conflict("Subject code already exists."); });
        applySubject(s, in);
    }

    public void deleteSubject(Long id) {
        Subject s = subjects.findById(id).orElseThrow(() -> ApiException.notFound("Subject"));
        for (Chapter c : new ArrayList<>(s.getChapters())) deleteChapter(c.getId());
        subjects.delete(s);
    }

    private static void applySubject(Subject s, SubjectInput in) {
        s.setCode(in.code());
        s.setName(in.name().trim());
        s.setDescription(in.description());
        s.setColor(in.color() == null ? "#6366f1" : in.color());
        s.setIcon(in.icon() == null ? "book" : in.icon());
        s.setGradeLevel(in.gradeLevel());
    }

    // ------------------------------------------------------------------ chapters

    public Long createChapter(ChapterInput in) {
        Subject s = subjects.findById(in.subjectId()).orElseThrow(() -> ApiException.notFound("Subject"));
        Chapter c = new Chapter();
        c.setSubject(s);
        c.setTitle(in.title().trim());
        c.setDescription(in.description());
        c.setPosition(in.position() == null ? s.getChapters().size() + 1 : in.position());
        return chapters.save(c).getId();
    }

    public void updateChapter(Long id, ChapterInput in) {
        Chapter c = chapters.findById(id).orElseThrow(() -> ApiException.notFound("Chapter"));
        c.setTitle(in.title().trim());
        c.setDescription(in.description());
        if (in.position() != null) c.setPosition(in.position());
    }

    public void deleteChapter(Long id) {
        Chapter c = chapters.findById(id).orElseThrow(() -> ApiException.notFound("Chapter"));
        for (Lesson l : new ArrayList<>(c.getLessons())) deleteLesson(l.getId());
        for (Quiz q : new ArrayList<>(c.getQuizzes())) deleteQuiz(q.getId());
        c.getSubject().getChapters().remove(c);
        chapters.delete(c);
    }

    // ------------------------------------------------------------------ lessons

    @Transactional(readOnly = true)
    public AdminLesson lesson(Long id) {
        Lesson l = lessons.findById(id).orElseThrow(() -> ApiException.notFound("Lesson"));
        return new AdminLesson(l.getId(), l.getChapter().getId(), l.getTitle(), l.getTopic(), l.getSummary(),
                l.getContent(), l.getVideoUrl(), l.getDurationMinutes(), l.getPosition());
    }

    public Long createLesson(LessonInput in) {
        Chapter c = chapters.findById(in.chapterId()).orElseThrow(() -> ApiException.notFound("Chapter"));
        Lesson l = new Lesson();
        l.setChapter(c);
        applyLesson(l, in, c.getLessons().size() + 1);
        return lessons.save(l).getId();
    }

    public void updateLesson(Long id, LessonInput in) {
        Lesson l = lessons.findById(id).orElseThrow(() -> ApiException.notFound("Lesson"));
        applyLesson(l, in, l.getPosition());
    }

    public void deleteLesson(Long id) {
        Lesson l = lessons.findById(id).orElseThrow(() -> ApiException.notFound("Lesson"));
        if (progress.existsByLessonId(id)) {
            throw ApiException.conflict("\"" + l.getTitle() + "\" has student completions and cannot be deleted.");
        }
        assignments.deleteByLessonId(id);
        recommendations.deleteAllForLesson(id);
        l.getChapter().getLessons().remove(l);
        lessons.delete(l);
    }

    private static void applyLesson(Lesson l, LessonInput in, int defaultPosition) {
        l.setTitle(in.title().trim());
        l.setTopic(in.topic());
        l.setSummary(in.summary());
        l.setContent(in.content());
        l.setVideoUrl(in.videoUrl() == null || in.videoUrl().isBlank() ? null : in.videoUrl().trim());
        l.setDurationMinutes(in.durationMinutes() == null ? 10 : in.durationMinutes());
        l.setPosition(in.position() == null ? defaultPosition : in.position());
    }

    // ------------------------------------------------------------------ quizzes & questions

    @Transactional(readOnly = true)
    public AdminQuiz quiz(Long id) {
        Quiz q = quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz"));
        List<AdminQuestion> qs = q.getQuestions().stream().map(x -> new AdminQuestion(x.getId(), x.getPrompt(),
                List.copyOf(x.getOptions()), x.getCorrectIndex(), x.getExplanation(), x.getTopic(), x.getPosition())).toList();
        List<String> topics = q.getChapter().getLessons().stream().map(Lesson::getTopic).distinct().toList();
        return new AdminQuiz(q.getId(), q.getChapter().getId(), q.getChapter().getTitle(), q.getTitle(),
                q.getDescription(), q.getTimeLimitSeconds(), qs, topics);
    }

    public Long createQuiz(QuizInput in) {
        Chapter c = chapters.findById(in.chapterId()).orElseThrow(() -> ApiException.notFound("Chapter"));
        if (!c.getQuizzes().isEmpty()) throw ApiException.conflict("This chapter already has a quiz.");
        Quiz q = new Quiz();
        q.setChapter(c);
        applyQuiz(q, in);
        return quizzes.save(q).getId();
    }

    public void updateQuiz(Long id, QuizInput in) {
        applyQuiz(quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz")), in);
    }

    public void deleteQuiz(Long id) {
        Quiz q = quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz"));
        if (attempts.existsByQuizId(id)) {
            throw ApiException.conflict("\"" + q.getTitle() + "\" has student attempts and cannot be deleted.");
        }
        assignments.deleteByQuizId(id);
        // Only unsubmitted sessions can exist here (a submitted one always has an attempt).
        quizSessions.deleteAnswersByQuizId(id);
        quizSessions.deleteSessionsByQuizId(id);
        q.getChapter().getQuizzes().remove(q);
        quizzes.delete(q);
    }

    private static void applyQuiz(Quiz q, QuizInput in) {
        q.setTitle(in.title().trim());
        q.setDescription(in.description());
        q.setTimeLimitSeconds(in.timeLimitSeconds() == null ? 300 : in.timeLimitSeconds());
    }

    public Long createQuestion(QuestionInput in) {
        Quiz quiz = quizzes.findById(in.quizId()).orElseThrow(() -> ApiException.notFound("Quiz"));
        Question q = new Question();
        q.setQuiz(quiz);
        q.setPosition(quiz.getQuestions().size() + 1);
        applyQuestion(q, in);
        quiz.getQuestions().add(q);
        return questions.save(q).getId();
    }

    public void updateQuestion(Long id, QuestionInput in) {
        Question q = questions.findById(id).orElseThrow(() -> ApiException.notFound("Question"));
        if (answers.existsByQuestionId(id) && in.correctIndex() != q.getCorrectIndex()) {
            throw ApiException.conflict("Students have answered this question; its correct answer can no longer change.");
        }
        applyQuestion(q, in);
    }

    public void deleteQuestion(Long id) {
        Question q = questions.findById(id).orElseThrow(() -> ApiException.notFound("Question"));
        if (answers.existsByQuestionId(id)) {
            throw ApiException.conflict("Students have answered this question, so it cannot be deleted.");
        }
        sessionAnswers.deleteByQuestionId(id);
        q.getQuiz().getQuestions().remove(q);
        questions.delete(q);
    }

    private static void applyQuestion(Question q, QuestionInput in) {
        if (in.correctIndex() >= in.options().size()) throw ApiException.badRequest("Correct answer must be one of the options.");
        q.setPrompt(in.prompt().trim());
        q.setOptions(new ArrayList<>(in.options().stream().map(String::trim).toList()));
        q.setCorrectIndex(in.correctIndex());
        q.setExplanation(in.explanation());
        q.setTopic(in.topic());
    }
}
