package esprit_market.config.deliveryeta;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@ConfigurationProperties(prefix = "app.delivery-eta")
@Data
public class DeliveryEtaConfig {
    private String openWeatherBaseUrl = "https://api.openweathermap.org";
    private String openWeatherApiKey = "";
    private String osrmBaseUrl = "https://router.project-osrm.org";
    private String mlBaseUrl = "http://127.0.0.1:8000";
    private int timeoutSeconds = 5;
    private boolean useMl = true;
    private boolean useExternalRouting = true;
    private boolean useExternalWeather = true;

    @Bean("deliveryWeatherWebClient")
    public WebClient deliveryWeatherWebClient() {
        return WebClient.builder().baseUrl(openWeatherBaseUrl).build();
    }

    @Bean("deliveryRouteWebClient")
    public WebClient deliveryRouteWebClient() {
        return WebClient.builder().baseUrl(osrmBaseUrl).build();
    }

    @Bean("deliveryEtaMlWebClient")
    public WebClient deliveryEtaMlWebClient() {
        return WebClient.builder().baseUrl(mlBaseUrl).build();
    }
}
