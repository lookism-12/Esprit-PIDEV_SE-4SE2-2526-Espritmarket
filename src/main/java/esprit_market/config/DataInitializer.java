package esprit_market.config;

import esprit_market.Enum.Role;
import esprit_market.entity.User;
import esprit_market.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Initializing data...");

        // Initialize Admin User
        String adminEmail = "admin@espritmarket.tn";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .firstName("Admin")
                    .lastName("Esprit")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("admin"))
                    .roles(Collections.singletonList(Role.ADMIN))
                    .enabled(true)
                    .build();

            userRepository.save(admin);
            log.info("Admin user created with email: {}", adminEmail);
        } else {
            log.info("Admin user already exists.");
        }
    }
}
