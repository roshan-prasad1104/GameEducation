package com.shikshasetu.common;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.ZoneId;
import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Ai ai, String timezone, Seed seed) {

    /** requireSecret: refuse to start without JWT_SECRET (set by the postgres profile). */
    public record Jwt(String secret, long expirationMinutes, boolean requireSecret) {}

    public record Cors(List<String> allowedOrigins) {}

    public record Ai(String baseUrl, int timeoutMs) {}

    public record Seed(boolean enabled) {}

    public ZoneId zone() {
        return ZoneId.of(timezone == null || timezone.isBlank() ? "Asia/Kolkata" : timezone);
    }
}
