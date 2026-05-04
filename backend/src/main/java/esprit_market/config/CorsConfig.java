package esprit_market.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * CORS Configuration for Spring Boot Application
 * 
 * Enables Cross-Origin Resource Sharing (CORS) to allow
 * Angular frontend (running on port 4200) to communicate with
 * Spring Boot backend (running on port 8090).
 * 
 * CRITICAL: This configuration MUST be injected into SecurityConfig
 * to work properly with Spring Security.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow requests from Angular frontend - CORRECTED PORTS
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:4200",    // Angular development server
                "http://localhost:3000",    // Alternative dev port  
                "http://127.0.0.1:4200",    // Localhost alias
                "http://localhost:4201",    // Alternative Angular port
                "https://espritmarket.com", // Production domain
                "https://www.espritmarket.com"
                "https://marketplace-frontend-g7fnhrdeakg2brcg.spaincentral-01.azurewebsites.net"
        ));

        // Allow ALL standard HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
                "GET",
                "POST", 
                "PUT",
                "DELETE",
                "PATCH",
                "OPTIONS",
                "HEAD"
        ));

        // Allow ALL necessary headers for Angular HttpClient + JWT
        configuration.setAllowedHeaders(Arrays.asList(
                "*"  // Allow all headers - simplifies Angular integration
        ));

        // CRITICAL: Allow credentials for JWT tokens
        configuration.setAllowCredentials(true);

        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        // Expose headers to frontend (for JWT response headers)
        configuration.setExposedHeaders(Arrays.asList(
                "Authorization",
                "Content-Type",
                "X-Total-Count"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
