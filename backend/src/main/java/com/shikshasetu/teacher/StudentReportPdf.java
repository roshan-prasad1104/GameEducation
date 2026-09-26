package com.shikshasetu.teacher;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.shikshasetu.gamification.GamificationDtos.BadgeView;
import com.shikshasetu.learning.LearningDtos.AttemptSummary;
import com.shikshasetu.student.StudentDtos.SubjectProgress;
import com.shikshasetu.teacher.TeacherDtos.StudentDetail;
import com.shikshasetu.teacher.TeacherDtos.StudentRow;
import com.shikshasetu.teacher.TeacherDtos.TopicStat;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Renders a student's progress report as a real PDF (OpenPDF): student details, progress,
 * subject performance, recent quizzes, topic accuracy and badges. Only data the app already
 * tracks is shown; there is no attendance register, so "active days" is reported instead.
 */
final class StudentReportPdf {
    private StudentReportPdf() {}

    /** Everything the report shows, gathered by {@link StudentReportService}. */
    record Data(StudentDetail detail, String className, String schoolName, String district, String teacherName,
                List<BadgeView> earnedBadges, Instant generatedAt, ZoneId zone) {}

    private static final Color BRAND = new Color(0x4F, 0x46, 0xE5);   // indigo-600, the app's brand colour
    private static final Color HEADER_BG = new Color(0xEE, 0xF2, 0xFF);
    private static final Color MUTED = new Color(0x64, 0x74, 0x8B);
    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BRAND);
    private static final Font SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 9, MUTED);
    private static final Font SECTION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, BRAND);
    private static final Font LABEL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
    private static final Font TEXT = FontFactory.getFont(FontFactory.HELVETICA, 9);
    private static final Font TH = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BRAND);
    private static final int MAX_QUIZZES = 15;

    static byte[] render(Data data) {
        StudentDetail d = data.detail();
        StudentRow s = d.student();
        DateTimeFormatter dateTime = DateTimeFormatter.ofPattern("d MMM yyyy, HH:mm", Locale.ENGLISH).withZone(data.zone());
        DateTimeFormatter date = DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH).withZone(data.zone());

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(doc, out);
        doc.addTitle("Student report - " + s.name());
        doc.addCreator("ShikshaSetu");
        doc.open();

        doc.add(new Paragraph("ShikshaSetu - Student Progress Report", TITLE));
        doc.add(new Paragraph("Generated " + dateTime.format(data.generatedAt()), SUBTITLE));

        section(doc, "Student");
        PdfPTable info = keyValues();
        kv(info, "Name", s.name());
        kv(info, "Email", s.email());
        kv(info, "Student ID", String.valueOf(s.id()));
        kv(info, "Grade", s.gradeLevel() == null ? "-" : "Grade " + s.gradeLevel());
        kv(info, "Class", orDash(data.className()));
        kv(info, "Teacher", orDash(data.teacherName()));
        kv(info, "School", orDash(data.schoolName()));
        kv(info, "District", orDash(data.district()));
        doc.add(info);

        section(doc, "Progress");
        PdfPTable progress = keyValues();
        kv(progress, "XP / Level", s.xp() + " XP  -  Level " + s.level());
        kv(progress, "Current streak", s.streak() + (s.streak() == 1 ? " day" : " days"));
        kv(progress, "Lessons completed", String.valueOf(s.lessonsCompleted()));
        kv(progress, "Quiz attempts", String.valueOf(s.quizAttempts()));
        kv(progress, "Average quiz score", s.averageScore() == null ? "-" : s.averageScore() + "%");
        kv(progress, "Active days (last 30 days)", String.valueOf(s.activeDays()));
        kv(progress, "Last active", s.lastActive() == null ? "-" : date.format(s.lastActive().atStartOfDay(data.zone())));
        kv(progress, "Status", segmentLabel(s.segment()) + (s.segmentReason() == null ? "" : " (" + s.segmentReason() + ")"));
        kv(progress, "Weakest topic", orDash(s.weakestTopic()));
        doc.add(progress);

        section(doc, "Subject performance");
        PdfPTable subjects = table(new float[]{3, 2, 1.5f, 1.8f}, "Subject", "Lessons completed", "Progress", "Avg. quiz score");
        for (SubjectProgress sp : d.subjects()) {
            cell(subjects, sp.subject().name());
            cell(subjects, sp.subject().completedLessons() + " / " + sp.subject().lessonCount());
            cell(subjects, sp.subject().progressPercent() + "%");
            cell(subjects, sp.averageQuizScore() == null ? "-" : sp.averageQuizScore() + "%");
        }
        doc.add(subjects);

        section(doc, d.attempts().size() > MAX_QUIZZES ? "Recent quizzes (latest " + MAX_QUIZZES + ")" : "Quizzes");
        if (d.attempts().isEmpty()) {
            doc.add(new Paragraph("No quiz attempts yet.", TEXT));
        } else {
            PdfPTable quizzes = table(new float[]{1.6f, 3.4f, 2, 1.4f, 1}, "Date", "Quiz", "Subject", "Score", "XP");
            for (AttemptSummary a : d.attempts().stream().limit(MAX_QUIZZES).toList()) {
                cell(quizzes, date.format(a.submittedAt()));
                cell(quizzes, a.quizTitle() + (a.syncedFromOffline() ? " (offline)" : ""));
                cell(quizzes, a.subjectName());
                cell(quizzes, a.correctCount() + "/" + a.totalQuestions() + " (" + a.percentage() + "%)");
                cell(quizzes, "+" + a.xpEarned());
            }
            doc.add(quizzes);
        }

        section(doc, "Topic accuracy");
        if (d.topics().isEmpty()) {
            doc.add(new Paragraph("No quiz answers yet.", TEXT));
        } else {
            PdfPTable topics = table(new float[]{3, 2, 1.4f, 1.4f}, "Topic", "Subject", "Answers", "Accuracy");
            for (TopicStat t : d.topics()) {
                cell(topics, t.topicName());
                cell(topics, t.subjectName());
                cell(topics, t.correct() + "/" + t.answered());
                cell(topics, t.accuracy() + "%");
            }
            doc.add(topics);
        }

        section(doc, "Badges");
        if (data.earnedBadges().isEmpty()) {
            doc.add(new Paragraph("No badges earned yet.", TEXT));
        } else {
            PdfPTable badges = table(new float[]{2, 4, 1.6f}, "Badge", "Earned for", "Date");
            for (BadgeView b : data.earnedBadges()) {
                cell(badges, b.name());
                cell(badges, b.description());
                cell(badges, b.earnedAt() == null ? "-" : date.format(b.earnedAt()));
            }
            doc.add(badges);
        }

        doc.close();
        return out.toByteArray();
    }

    // ------------------------------------------------------------------ layout helpers

    private static void section(Document doc, String title) {
        Paragraph p = new Paragraph(title, SECTION);
        p.setSpacingBefore(14);
        p.setSpacingAfter(6);
        doc.add(p);
    }

    private static PdfPTable keyValues() {
        PdfPTable t = new PdfPTable(new float[]{1.4f, 3});
        t.setWidthPercentage(100);
        return t;
    }

    private static void kv(PdfPTable t, String label, String value) {
        PdfPCell l = new PdfPCell(new Phrase(label, LABEL));
        l.setBackgroundColor(HEADER_BG);
        pad(l);
        t.addCell(l);
        PdfPCell v = new PdfPCell(new Phrase(value, TEXT));
        pad(v);
        t.addCell(v);
    }

    private static PdfPTable table(float[] widths, String... headers) {
        PdfPTable t = new PdfPTable(widths);
        t.setWidthPercentage(100);
        t.setHeaderRows(1);
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, TH));
            c.setBackgroundColor(HEADER_BG);
            pad(c);
            t.addCell(c);
        }
        return t;
    }

    private static void cell(PdfPTable t, String text) {
        PdfPCell c = new PdfPCell(new Phrase(text == null ? "-" : text, TEXT));
        pad(c);
        t.addCell(c);
    }

    private static void pad(PdfPCell c) {
        c.setPadding(4);
        c.setBorderColor(new Color(0xE2, 0xE8, 0xF0));
    }

    private static String orDash(String s) {
        return s == null || s.isBlank() ? "-" : s;
    }

    private static String segmentLabel(String segment) {
        if (segment == null) return "-";
        return switch (segment) {
            case "NEEDS_SUPPORT" -> "Needs support";
            case "ON_TRACK" -> "On track";
            case "ADVANCED" -> "Advanced";
            default -> segment;
        };
    }
}
