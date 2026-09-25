package com.shikshasetu.common;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(int status, String code, String message, Map<String, String> fieldErrors, Instant timestamp) {
    public static ErrorResponse of(int status, String code, String message) {
        return new ErrorResponse(status, code, message, null, Instant.now());
    }
}
