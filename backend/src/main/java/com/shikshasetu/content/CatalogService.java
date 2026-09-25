package com.shikshasetu.content;

import com.shikshasetu.common.ApiException;
import com.shikshasetu.content.CatalogDtos.*;
import com.shikshasetu.learning.LessonProgressRepository;
import com.shikshasetu.learning.QuizAttemptRepository;
import com.shikshasetu.security.AuthUser;
import com.shikshasetu.user.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;

/** Read-side of the curriculum, decorated with the current student's progress. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogService {
    private final SubjectRepository subjects;
    private final ChapterRepository chapters;
    private final LessonRepository lessons;
    private final QuizRepository quizzes;
    private final LessonProgressRepository progress;
    private final QuizAttemptRepository attempts;

    public List<SubjectCard> listSubjects(AuthUser user) {
        Set<Long> done = completedIds(user);
        return subjects.findAllByOrderByIdAsc().stream().map(s -> subjectCard(s, done)).toList();
    }

    public SubjectDetail subject(Long id, AuthUser user) {
        Subject s = subjects.findById(id).orElseThrow(() -> ApiException.notFound("Subject"));
        Set<Long> done = completedIds(user);
        List<ChapterCard> cards = s.getChapters().stream().map(c -> chapterCard(c, done, user)).toList();
        return new SubjectDetail(subjectCard(s, done), cards);
    }

    public ChapterDetail chapter(Long id, AuthUser user) {
        Chapter c = chapters.findById(id).orElseThrow(() -> ApiException.notFound("Chapter"));
        return chapterDetail(c, completedIds(user), user);
    }

    public LessonDetail lesson(Long id, AuthUser user) {
        Lesson l = lessons.findById(id).orElseThrow(() -> ApiException.notFound("Lesson"));
        return lessonDetail(l, completedIds(user));
    }

    public QuizView quiz(Long id) {
        Quiz q = quizzes.findById(id).orElseThrow(() -> ApiException.notFound("Quiz"));
        return quizView(q);
    }

    public OfflineBundle offlineBundle(Long chapterId, AuthUser user) {
        Chapter c = chapters.findById(chapterId).orElseThrow(() -> ApiException.notFound("Chapter"));
        Set<Long> done = completedIds(user);
        List<LessonDetail> details = c.getLessons().stream().map(l -> lessonDetail(l, done)).toList();
        Quiz quiz = c.getQuizzes().isEmpty() ? null : c.getQuizzes().getFirst();
        return new OfflineBundle(chapterDetail(c, done, user), details, quiz == null ? null : quizView(quiz));
    }

    // ------------------------------------------------------------------ mapping

    private Set<Long> completedIds(AuthUser user) {
        if (user == null || user.role() != Role.STUDENT) return Collections.emptySet();
        return progress.findCompletedLessonIds(user.id());
    }

    private SubjectCard subjectCard(Subject s, Set<Long> done) {
        int lessonCount = 0;
        int completed = 0;
        for (Chapter c : s.getChapters()) {
            for (Lesson l : c.getLessons()) {
                lessonCount++;
                if (done.contains(l.getId())) completed++;
            }
        }
        return new SubjectCard(s.getId(), s.getCode(), s.getName(), s.getDescription(), s.getColor(), s.getIcon(),
                s.getGradeLevel(), s.getChapters().size(), lessonCount, completed, percent(completed, lessonCount));
    }

    private ChapterCard chapterCard(Chapter c, Set<Long> done, AuthUser user) {
        int completed = (int) c.getLessons().stream().filter(l -> done.contains(l.getId())).count();
        return new ChapterCard(c.getId(), c.getTitle(), c.getDescription(), c.getPosition(),
                c.getLessons().size(), completed, quizCard(c, user));
    }

    private ChapterDetail chapterDetail(Chapter c, Set<Long> done, AuthUser user) {
        List<LessonCard> cards = c.getLessons().stream()
                .map(l -> new LessonCard(l.getId(), l.getTitle(), l.getSummary(), l.getTopic(), l.getDurationMinutes(),
                        l.getPosition(), done.contains(l.getId())))
                .toList();
        int completed = (int) cards.stream().filter(LessonCard::completed).count();
        return new ChapterDetail(c.getId(), c.getTitle(), c.getDescription(), c.getPosition(),
                SubjectRef.of(c.getSubject()), cards, quizCard(c, user), completed);
    }

    private QuizCard quizCard(Chapter c, AuthUser user) {
        if (c.getQuizzes().isEmpty()) return null;
        Quiz q = c.getQuizzes().getFirst();
        Integer best = user != null && user.role() == Role.STUDENT ? attempts.findBestPercentage(user.id(), q.getId()) : null;
        return new QuizCard(q.getId(), q.getTitle(), q.getDescription(), q.getQuestions().size(),
                q.getTimeLimitSeconds(), best);
    }

    private LessonDetail lessonDetail(Lesson l, Set<Long> done) {
        Chapter c = l.getChapter();
        List<Lesson> siblings = c.getLessons();
        int idx = siblings.indexOf(l);
        Long prev = idx > 0 ? siblings.get(idx - 1).getId() : null;
        Long next = idx >= 0 && idx < siblings.size() - 1 ? siblings.get(idx + 1).getId() : null;
        Long quizId = c.getQuizzes().isEmpty() ? null : c.getQuizzes().getFirst().getId();
        return new LessonDetail(l.getId(), l.getTitle(), l.getSummary(), l.getTopic(), l.getContent(), l.getVideoUrl(),
                l.getDurationMinutes(), l.getPosition(), done.contains(l.getId()), ChapterRef.of(c),
                SubjectRef.of(c.getSubject()), prev, next, quizId);
    }

    private QuizView quizView(Quiz q) {
        Chapter c = q.getChapter();
        List<QuestionView> qs = q.getQuestions().stream()
                .map(x -> new QuestionView(x.getId(), x.getPrompt(), List.copyOf(x.getOptions()), x.getTopic(), x.getPosition()))
                .toList();
        return new QuizView(q.getId(), q.getTitle(), q.getDescription(), q.getTimeLimitSeconds(),
                ChapterRef.of(c), SubjectRef.of(c.getSubject()), qs);
    }

    static int percent(long part, long whole) {
        return whole == 0 ? 0 : (int) Math.round(100.0 * part / whole);
    }
}
