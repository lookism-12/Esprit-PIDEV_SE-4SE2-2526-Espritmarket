package esprit_market.service.mlService;

import esprit_market.config.PredictiveAiConfig;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class PredictiveAiService {

    private final WebClient webClient;
    private final PredictiveAiConfig config;

    @org.springframework.beans.factory.annotation.Autowired
    public PredictiveAiService(
            @Qualifier("predictiveAiWebClient") WebClient webClient,
            PredictiveAiConfig config) {
        this.webClient = webClient;
        this.config = config;
    }

    @Data
    @Builder
    public static class NegotiationAiRequest {
        private double base_price;
        private double offered_price;
        private int quantity;
        private double buyer_rating;
        private int buyer_account_age_months;
        private int is_return_customer;
        private int message_length;
        private int has_exchange_proposal;
        private int has_image_attachment;
        private String product_category;
    }

    @Data
    public static class NegotiationAiResponse {
        private String prediction;
        private Map<String, Double> probabilities;
        private double accept_probability;
        private List<String> explanation;
    }

    @Data
    @Builder
    public static class CarpoolingAiRequest {
        private double passenger_rating;
        private double ride_distance_km;
        private double pickup_distance_km;
        private double fare_offered;
        private int requested_seats;
        private int available_seats;
        private String time_of_day;
        private int is_weekend;
        private int has_luggage;
        private int has_pets;
        private String passenger_gender;
        private String driver_gender;
    }

    @Data
    public static class CarpoolingAiResponse {
        private String decision;
        private String prediction;
        private double accept_probability;
        private double reject_probability;
        private List<String> explanation;
    }

    public Mono<NegotiationAiResponse> predictNegotiation(NegotiationAiRequest request) {
        if (!config.isEnabled()) {
            return Mono.empty();
        }
        return webClient.post()
                .uri("/predict")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(NegotiationAiResponse.class)
                .doOnError(e -> log.error("Error calling Negotiation AI service: {}", e.getMessage()));
    }

    public Mono<CarpoolingAiResponse> predictCarpooling(CarpoolingAiRequest request) {
        if (!config.isEnabled()) {
            return Mono.empty();
        }
        return webClient.post()
                .uri("/predict-carpooling")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(CarpoolingAiResponse.class)
                .doOnError(e -> log.error("Error calling Carpooling AI service: {}", e.getMessage()));
    }

    // ── Incremental learning feedback DTOs ────────────────────────────────────

    @Data
    @Builder
    public static class NegotiationFeedback {
        private double base_price;
        private double offered_price;
        private int quantity;
        private double buyer_rating;
        private int buyer_account_age_months;
        private int is_return_customer;
        private int message_length;
        private int has_exchange_proposal;
        private int has_image_attachment;
        private String product_category;
        private String provider_decision;   // "ACCEPT" or "REJECT"
    }

    @Data
    @Builder
    public static class CarpoolingFeedback {
        private double passenger_rating;
        private double ride_distance_km;
        private double pickup_distance_km;
        private double fare_offered;
        private int requested_seats;
        private int available_seats;
        private String time_of_day;
        private int is_weekend;
        private int has_luggage;
        private int has_pets;
        private String passenger_gender;
        private String driver_gender;
        private String driver_decision;     // "ACCEPT" or "REJECT"
    }

    /**
     * Send a resolved negotiation outcome to the ML service for incremental learning.
     * Fire-and-forget — never blocks the main flow.
     */
    public void sendNegotiationFeedback(NegotiationFeedback feedback) {
        if (!config.isEnabled()) return;
        webClient.post()
                .uri("/feedback/negotiation")
                .bodyValue(feedback)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(e -> log.warn("Negotiation feedback send failed: {}", e.getMessage()))
                .subscribe();
    }

    /**
     * Send a resolved ride-request outcome to the ML service for incremental learning.
     * Fire-and-forget — never blocks the main flow.
     */
    public void sendCarpoolingFeedback(CarpoolingFeedback feedback) {
        if (!config.isEnabled()) return;
        webClient.post()
                .uri("/feedback/carpooling")
                .bodyValue(feedback)
                .retrieve()
                .bodyToMono(String.class)
                .doOnError(e -> log.warn("Carpooling feedback send failed: {}", e.getMessage()))
                .subscribe();
    }

    public String getBaseUrl() {
        return config.getBaseUrl();
    }
}
