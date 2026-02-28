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
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    private final AuthEntryPointJwt unauthorizedHandler;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

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
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(request -> {
                    var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                    corsConfig.setAllowedOrigins(java.util.List.of("*"));
                    corsConfig.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                    corsConfig.setAllowedHeaders(java.util.List.of("*"));
                    return corsConfig;
                }))
                .exceptionHandling(ex -> ex.authenticationEntryPoint(unauthorizedHandler))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/users/register", "/api/users/login").permitAll()
                        .requestMatchers("/api/rides/search").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/seller/**").hasAnyRole("ADMIN", "SELLER")
                        // Carpooling Profiles
                        .requestMatchers(HttpMethod.PATCH, "/api/driver-profiles/*/verify").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/driver-profiles/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/passenger-profiles/**").hasRole("ADMIN")
                        .requestMatchers("/api/driver-profiles/me").hasRole("DRIVER")
                        .requestMatchers("/api/passenger-profiles/me").hasRole("PASSENGER")
                        .requestMatchers("/api/driver-profiles/**").authenticated()
                        .requestMatchers("/api/passenger-profiles/**").authenticated()

                        // Carpooling Rides & Vehicles
                        .requestMatchers(HttpMethod.POST, "/api/rides").hasRole("DRIVER")
                        .requestMatchers(HttpMethod.PATCH, "/api/rides/**").hasRole("DRIVER")
                        .requestMatchers(HttpMethod.DELETE, "/api/rides/**").hasRole("DRIVER")
                        .requestMatchers("/api/vehicles/my").hasRole("DRIVER")
                        .requestMatchers(HttpMethod.POST, "/api/vehicles").hasRole("DRIVER")
                        .requestMatchers(HttpMethod.DELETE, "/api/vehicles/**").hasRole("DRIVER")
                        .requestMatchers(HttpMethod.PATCH, "/api/vehicles/**").hasRole("DRIVER")

                        // Bookings, Payments, Reviews
                        .requestMatchers(HttpMethod.GET, "/api/bookings").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/bookings").hasRole("PASSENGER")
                        .requestMatchers(HttpMethod.DELETE, "/api/bookings/**").hasRole("PASSENGER")
                        .requestMatchers(HttpMethod.PATCH, "/api/bookings/**").hasRole("PASSENGER")
                        .requestMatchers(HttpMethod.GET, "/api/ride-payments").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/ride-payments/**").hasRole("ADMIN")
                        .requestMatchers("/api/ride-payments/**").authenticated()
                        .requestMatchers("/api/ride-reviews/received").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/ride-reviews/**").hasRole("ADMIN")
                        .requestMatchers("/api/ride-reviews/**").authenticated()
                        .anyRequest().authenticated())
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
