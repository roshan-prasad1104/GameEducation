package com.shikshasetu.teacher;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

/** HTTP response for a student report: application/pdf, downloaded as student-report-<id>.pdf. */
public final class StudentReportResponse {
    private StudentReportResponse() {}

    public static ResponseEntity<byte[]> of(Long studentId, byte[] pdf) {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("student-report-" + studentId + ".pdf").build().toString())
                .body(pdf);
    }
}
