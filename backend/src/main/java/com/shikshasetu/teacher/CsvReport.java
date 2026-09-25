package com.shikshasetu.teacher;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Flat RFC 4180 CSV (UTF-8 with BOM, one header row) so the exports open directly in
 * Excel and load into Power BI / Google Sheets without transformation.
 */
final class CsvReport {
    private CsvReport() {}

    static ResponseEntity<byte[]> of(String filename, List<String> header, List<List<?>> rows) {
        StringBuilder sb = new StringBuilder("﻿");
        line(sb, header);
        rows.forEach(r -> line(sb, r));
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    private static void line(StringBuilder sb, List<?> cells) {
        sb.append(cells.stream().map(CsvReport::cell).collect(Collectors.joining(","))).append("\r\n");
    }

    private static String cell(Object value) {
        String s = Objects.toString(value, "");
        // Text starting with = + - @ would be evaluated as a formula by spreadsheet apps.
        if (!s.isEmpty() && "=+-@".indexOf(s.charAt(0)) >= 0 && !(value instanceof Number)) s = "'" + s;
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}
