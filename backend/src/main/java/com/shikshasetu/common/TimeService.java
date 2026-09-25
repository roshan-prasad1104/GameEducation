package com.shikshasetu.common;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

/** Central place for "now" and "today" so streaks and daily missions use one time zone. */
@Component
public class TimeService {
    private static final long MAX_CLIENT_AGE_SECONDS = 14L * 86400;

    private final ZoneId zone;

    public TimeService(AppProperties props) {
        this.zone = props.zone();
    }

    public Instant now() {
        return Instant.now();
    }

    public LocalDate today() {
        return LocalDate.now(zone);
    }

    public LocalDate dateOf(Instant instant) {
        return instant.atZone(zone).toLocalDate();
    }

    public Instant startOf(LocalDate date) {
        return date.atStartOfDay(zone).toInstant();
    }

    /**
     * Accepts a client-reported timestamp (sent by offline sync) only when it is plausible:
     * not in the future and not older than 14 days. Otherwise falls back to server time.
     */
    public Instant clientTimeOrNow(Instant client) {
        Instant now = now();
        if (client == null || client.isAfter(now.plusSeconds(60)) || client.isBefore(now.minusSeconds(MAX_CLIENT_AGE_SECONDS))) {
            return now;
        }
        return client;
    }
}
