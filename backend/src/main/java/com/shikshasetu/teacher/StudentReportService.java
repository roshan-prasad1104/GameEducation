package com.shikshasetu.teacher;

import com.shikshasetu.common.ApiException;
import com.shikshasetu.common.TimeService;
import com.shikshasetu.content.ContentText;
import com.shikshasetu.gamification.GamificationDtos.BadgeView;
import com.shikshasetu.gamification.GamificationService;
import com.shikshasetu.school.Classroom;
import com.shikshasetu.teacher.TeacherDtos.StudentDetail;
import com.shikshasetu.user.StudentProfile;
import com.shikshasetu.user.StudentProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * PDF progress report for one student. Teachers may only report on students in their own classes
 * (the same check as the student detail view, 404 otherwise); admins on any student.
 * Rendered in English: the PDF library cannot shape Devanagari, Odia or Telugu script.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentReportService {
    private final TeacherService teacher;
    private final StudentProfileRepository profiles;
    private final GamificationService gamification;
    private final TimeService time;

    public byte[] forTeacher(Long teacherId, Long studentId) {
        return ContentText.inLanguage(ContentText.ENGLISH, () -> render(studentId, teacher.student(teacherId, studentId)));
    }

    public byte[] forAdmin(Long studentId) {
        return ContentText.inLanguage(ContentText.ENGLISH, () -> render(studentId, teacher.studentForAdmin(studentId)));
    }

    private byte[] render(Long studentId, StudentDetail detail) {
        StudentProfile p = profiles.findByUserId(studentId).orElseThrow(() -> ApiException.notFound("Student"));
        Classroom c = p.getClassroom();
        List<BadgeView> earned = gamification.badgesFor(studentId).stream().filter(BadgeView::earned).toList();
        return StudentReportPdf.render(new StudentReportPdf.Data(detail,
                c == null ? null : c.getName(),
                c == null ? p.getSchool() : c.getSchool().getName(),
                c == null ? p.getDistrict() : c.getSchool().getDistrict(),
                c == null || c.getTeacher() == null ? null : c.getTeacher().getName(),
                earned, Instant.now(), time.zone()));
    }
}
