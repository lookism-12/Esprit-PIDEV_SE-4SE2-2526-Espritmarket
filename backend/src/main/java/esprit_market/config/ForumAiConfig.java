package esprit_market.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@ConfigurationProperties(prefix = "app.forum-ai")
@Data
public class ForumAiConfig {
    private String baseUrl = "http://127.0.0.1:8001";
    private int timeoutSeconds = 8;
    private int maxRetries = 1;
    private boolean enabled = true;
    private int defaultTopK = 5;

    @Bean("forumAiWebClient")
    public WebClient forumAiWebClient() {
        return WebClient.builder()
                .baseUrl(baseUrl)
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024))
                .build();
    }
}
