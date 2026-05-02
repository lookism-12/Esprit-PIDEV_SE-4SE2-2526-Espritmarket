package esprit_market.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Configuration for Cart ML Service (port 8002)
 * Provides promotion suggestions and price adjustments
 */
@Configuration
@ConfigurationProperties(prefix = "app.cart-ml")
@Data
public class CartMLConfig {

    private String baseUrl = "http://localhost:8002";
    private int timeoutSeconds = 10;
    private boolean enabled = true;

    @Bean("cartMLWebClient")
    public WebClient cartMLWebClient() {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(c -> c.defaultCodecs().maxInMemorySize(512 * 1024))
                .build();
    }
}
