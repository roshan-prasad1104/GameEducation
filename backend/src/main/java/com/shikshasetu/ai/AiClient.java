package com.shikshasetu.ai;

import com.shikshasetu.ai.AiDtos.*;
import com.shikshasetu.common.AppProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Optional;

/** HTTP client for the Python recommender. Returns empty when the service is unreachable. */
@Slf4j
@Component
public class AiClient {
    private final RestClient client;

    public AiClient(AppProperties props) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.ai().timeoutMs());
        factory.setReadTimeout(props.ai().timeoutMs());
        this.client = RestClient.builder().baseUrl(props.ai().baseUrl()).requestFactory(factory).build();
    }

    public Optional<RecommendResponse> recommend(RecommendRequest request) {
        return post("/recommend", request, RecommendResponse.class);
    }

    public Optional<SegmentResponse> segments(SegmentRequest request) {
        return post("/segments", request, SegmentResponse.class);
    }

    public boolean isHealthy() {
        try {
            client.get().uri("/health").retrieve().toBodilessEntity();
            return true;
        } catch (RestClientException e) {
            return false;
        }
    }

    private <T> Optional<T> post(String path, Object body, Class<T> type) {
        try {
            return Optional.ofNullable(client.post().uri(path).contentType(MediaType.APPLICATION_JSON)
                    .body(body).retrieve().body(type));
        } catch (RestClientException e) {
            log.warn("AI service call {} failed ({}); using the built-in fallback.", path, e.getMessage());
            return Optional.empty();
        }
    }
}
