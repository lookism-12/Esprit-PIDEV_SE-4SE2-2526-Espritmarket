package esprit_market.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configuration for the Negotiation and Carpooling ML Service (port 8000)
 */
@Configuration
@ConfigurationProperties(prefix = "app.predictive-ai")
@Data
public class PredictiveAiConfig {

    private String baseUrl = "http://127.0.0.1:8000";
    private int timeoutSeconds = 15;
    private boolean enabled = true;

    @Bean("predictiveAiWebClient")
    public WebClient predictiveAiWebClient() {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(c -> c.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }
}
