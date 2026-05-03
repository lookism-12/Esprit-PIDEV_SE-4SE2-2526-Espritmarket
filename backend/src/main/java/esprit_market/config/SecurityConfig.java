package esprit_market.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource; // Injected from CorsConfig bean

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CRITICAL: CORS must be configured FIRST before other security measures
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(AbstractHttpConfigurer::disable)
                .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public authentication endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/users/register", "/api/users/login", "/api/users/forgot-password",
                                "/api/users/reset-password", "/api/users/oauth/**")
                        .permitAll()
                        
                        // Documentation and error endpoints
                        .requestMatchers("/v3/api-docs/**", "/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/uploads/**").permitAll()
                        
                        // CRITICAL: Public marketplace endpoints for Angular frontend
                        .requestMatchers("GET", "/api/categories").permitAll() // Get all categories
                        .requestMatchers("GET", "/api/categories/**").permitAll() // Get category by ID
                        .requestMatchers("GET", "/api/products").permitAll() // Get all products  
                        .requestMatchers("GET", "/api/products/**").permitAll() // Get product by ID
                        .requestMatchers("GET", "/api/shops").permitAll() // Browse shops
                        .requestMatchers("GET", "/api/shops/**").permitAll() // Shop details
                        
                        // OPTIONS requests (CORS preflight) - MUST be public
                        .requestMatchers("OPTIONS", "/**").permitAll()
                        
                        // WebSocket endpoint for STOMP/SockJS
                        .requestMatchers("/ws/**", "/api/chat/**").permitAll()

                        // Public: current TVA rate (used by cart/checkout)
                        .requestMatchers("GET", "/api/admin/tax-config/effective").permitAll()
                        
                        // Admin endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/seller/**").hasAnyRole("ADMIN", "SELLER", "PROVIDER")
                        
                        // All other requests require authentication
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
