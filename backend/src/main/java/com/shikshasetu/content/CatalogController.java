package com.shikshasetu.content;

import com.shikshasetu.content.CatalogDtos.*;
import com.shikshasetu.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Curriculum browsing — available to every signed-in role. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CatalogController {
    private final CatalogService catalog;

    @GetMapping("/subjects")
    public List<SubjectCard> subjects() {
        return catalog.listSubjects(CurrentUser.get());
    }

    @GetMapping("/catalog/outline")
    public List<OutlineSubject> outline() {
        return catalog.outline();
    }

    @GetMapping("/subjects/{id}")
    public SubjectDetail subject(@PathVariable Long id) {
        return catalog.subject(id, CurrentUser.get());
    }

    @GetMapping("/chapters/{id}")
    public ChapterDetail chapter(@PathVariable Long id) {
        return catalog.chapter(id, CurrentUser.get());
    }

    @GetMapping("/chapters/{id}/offline-bundle")
    public OfflineBundle offlineBundle(@PathVariable Long id) {
        return catalog.offlineBundle(id, CurrentUser.get());
    }

    @GetMapping("/lessons/{id}")
    public LessonDetail lesson(@PathVariable Long id) {
        return catalog.lesson(id, CurrentUser.get());
    }

    @GetMapping("/quizzes/{id}")
    public QuizView quiz(@PathVariable Long id) {
        return catalog.quiz(id);
    }
}
