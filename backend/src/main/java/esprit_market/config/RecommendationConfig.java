package esprit_market.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import lombok.Data;

import java.time.Duration;

/**
 * Configuration for ML Recommendation Service
 */
@Configuration
@ConfigurationProperties(prefix = "app.ml-service")
@Data
public class RecommendationConfig {
    
    private String baseUrl = "http://127.0.0.1:8000";
    private int timeoutSeconds = 30;
    private int maxRetries = 3;
    private boolean enabled = true;
    private boolean useFallback = true;
    
    @Bean("recommendationWebClient")
    public WebClient recommendationWebClient() {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024)) // 1MB
                .build();
    }
}