package esprit_market.config;

import esprit_market.Enum.userEnum.Role;
import esprit_market.dto.carpooling.DriverProfileRequestDTO;
import esprit_market.dto.carpooling.PassengerProfileRequestDTO;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.service.carpoolingService.DriverProfileService;
import esprit_market.service.carpoolingService.PassengerProfileService;
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
    private final DriverProfileService driverProfileService;
    private final PassengerProfileService passengerProfileService;
    private final esprit_market.repository.carpoolingRepository.DriverProfileRepository driverProfileRepository;

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

        // Initialize Test Driver User
        String driverEmail = "driver@espritmarket.tn";
        if (!userRepository.existsByEmail(driverEmail)) {
            User driver = User.builder()
                    .firstName("Test")
                    .lastName("Driver")
                    .email(driverEmail)
                    .password(passwordEncoder.encode("driver123"))
                    .roles(Collections.singletonList(Role.DRIVER))
                    .enabled(true)
                    .build();

            userRepository.save(driver);
            log.info("Test driver user created with email: {}", driverEmail);
        }

        // Initialize Test Passenger User
        String passengerEmail = "passenger@espritmarket.tn";
        if (!userRepository.existsByEmail(passengerEmail)) {
            User passenger = User.builder()
                    .firstName("Test")
                    .lastName("Passenger")
                    .email(passengerEmail)
                    .password(passwordEncoder.encode("passenger123"))
                    .roles(Collections.singletonList(Role.PASSENGER))
                    .enabled(true)
                    .build();

            userRepository.save(passenger);
            log.info("Test passenger user created with email: {}", passengerEmail);
        }

        // Ensure driver profile for driverEmail
        userRepository.findByEmail(driverEmail).ifPresent(driver -> {
            if (!driverProfileRepository.existsByUserId(driver.getId())) {
                try {
                    DriverProfileRequestDTO dto = DriverProfileRequestDTO.builder()
                            .licenseNumber("DRV-TEST-001")
                            .licenseDocument("test_license.pdf")
                            .build();
                    driverProfileService.registerDriver(driverEmail, dto);
                    log.info("Driver profile created for existing user: {}", driverEmail);
                } catch (Exception e) {
                    log.error("Failed to create driver profile for existing user {}: {}", driverEmail, e.getMessage());
                }
            } else {
                log.info("Driver profile already exists for user: {}", driverEmail);
            }
        });

        // Ensure passenger profile for passengerEmail
        userRepository.findByEmail(passengerEmail).ifPresent(passenger -> {
            if (passengerProfileService.findByUserId(passenger.getId()) == null) {
                try {
                    PassengerProfileRequestDTO dto = PassengerProfileRequestDTO.builder()
                            .preferences("No smoking, quiet ride")
                            .build();
                    passengerProfileService.registerPassenger(passengerEmail, dto);
                    log.info("Passenger profile created for existing user: {}", passengerEmail);
                } catch (Exception e) {
                    log.error("Failed to create passenger profile for existing user {}: {}", passengerEmail,
                            e.getMessage());
                }
            }
        });
    }
}
