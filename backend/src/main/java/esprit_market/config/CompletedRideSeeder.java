package esprit_market.config;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.entity.carpooling.*;
import esprit_market.entity.user.User;
import esprit_market.repository.carpoolingRepository.*;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds ONE completed ride with a confirmed booking so the review system
 * can be tested immediately.
 *
 * Runs only in the "development" profile (default).
 * Safe to run multiple times — skips if a completed ride already exists.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
@Profile("development")
public class CompletedRideSeeder {

    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;

    @Bean
    CommandLineRunner seedCompletedRide() {
        return args -> {

            // ── Skip if a completed ride already exists ───────────────────
            boolean alreadyExists = rideRepository.findAll().stream()
                    .anyMatch(r -> r.getStatus() == RideStatus.COMPLETED);
            if (alreadyExists) {
                log.info("✅ Completed ride already exists — skipping seeder");
                return;
            }

            // ── Pick two real users from the DB ───────────────────────────
            List<User> users = userRepository.findAll();
            if (users.size() < 2) {
                log.warn("⚠️  Need at least 2 users in DB to seed a completed ride. Skipping.");
                return;
            }

            User driverUser    = users.get(0);
            User passengerUser = users.get(1);

            log.info("🌱 Seeding completed ride — driver: {} | passenger: {}",
                    driverUser.getEmail(), passengerUser.getEmail());

            // ── Ensure DriverProfile exists for driverUser ────────────────
            DriverProfile driverProfile = driverProfileRepository
                    .findByUserId(driverUser.getId())
                    .orElseGet(() -> {
                        DriverProfile dp = DriverProfile.builder()
                                .userId(driverUser.getId())
                                .licenseNumber("TN-SEED-001")
                                .isVerified(true)
                                .averageRating(0f)
                                .totalRidesCompleted(0)
                                .totalEarnings(0f)
                                .driverScore(50f)
                                .badge("BRONZE")
                                .rideIds(new java.util.ArrayList<>())
                                .vehicleIds(new java.util.ArrayList<>())
                                .build();
                        return driverProfileRepository.save(dp);
                    });

            // ── Ensure PassengerProfile exists for passengerUser ──────────
            PassengerProfile passengerProfile = passengerProfileRepository
                    .findByUserId(passengerUser.getId())
                    .orElseGet(() -> {
                        PassengerProfile pp = PassengerProfile.builder()
                                .userId(passengerUser.getId())
                                .averageRating(0f)
                                .preferences("")
                                .totalRidesCompleted(0)
                                .build();
                        return passengerProfileRepository.save(pp);
                    });

            // ── Ensure Vehicle exists for driver ──────────────────────────
            Vehicle vehicle = vehicleRepository
                    .findByDriverProfileId(driverProfile.getId())
                    .stream().findFirst()
                    .orElseGet(() -> {
                        Vehicle v = Vehicle.builder()
                                .driverProfileId(driverProfile.getId())
                                .make("Toyota")
                                .model("Corolla")
                                .licensePlate("TN-SEED-123")
                                .numberOfSeats(4)
                                .build();
                        return vehicleRepository.save(v);
                    });

            // ── Create the COMPLETED ride ─────────────────────────────────
            LocalDateTime departureTime = LocalDateTime.now().minusHours(3);
            LocalDateTime completedAt   = LocalDateTime.now().minusHours(1);

            Ride unsavedRide = Ride.builder()
                    .driverProfileId(driverProfile.getId())
                    .vehicleId(vehicle.getId())
                    .departureLocation("Tunis Centre")
                    .destinationLocation("Sfax")
                    .departureTime(departureTime)
                    .availableSeats(0)
                    .pricePerSeat(15.0f)
                    .status(RideStatus.COMPLETED)
                    .estimatedDurationMinutes(120)
                    .completedAt(completedAt)
                    .build();
            final Ride ride = rideRepository.save(unsavedRide);

            // ── Create a COMPLETED booking for the passenger ──────────────
            Booking booking = Booking.builder()
                    .rideId(ride.getId())
                    .passengerProfileId(passengerProfile.getId())
                    .numberOfSeats(1)
                    .pickupLocation("Tunis Centre")
                    .dropoffLocation("Sfax")
                    .status(BookingStatus.COMPLETED)
                    .totalPrice(15.0f)
                    .build();
            bookingRepository.save(booking);

            // ── Update driver profile ride list ───────────────────────────
            if (driverProfile.getRideIds() == null) {
                driverProfile.setRideIds(new java.util.ArrayList<>());
            }
            driverProfile.getRideIds().add(ride.getId());
            driverProfile.setTotalRidesCompleted(
                    (driverProfile.getTotalRidesCompleted() == null ? 0
                            : driverProfile.getTotalRidesCompleted()) + 1);
            driverProfileRepository.save(driverProfile);

            // ── Update user roles so they can use the carpooling system ───
            if (driverUser.getDriverProfileId() == null) {
                driverUser.setDriverProfileId(driverProfile.getId());
                userRepository.save(driverUser);
            }
            if (passengerUser.getPassengerProfileId() == null) {
                passengerUser.setPassengerProfileId(passengerProfile.getId());
                userRepository.save(passengerUser);
            }

            log.info("✅ Completed ride seeded successfully!");
            log.info("   Ride ID       : {}", ride.getId().toHexString());
            log.info("   Driver user   : {} ({})", driverUser.getEmail(), driverUser.getId().toHexString());
            log.info("   Passenger user: {} ({})", passengerUser.getEmail(), passengerUser.getId().toHexString());
            log.info("   → Log in as the passenger and go to My Requests to rate the ride.");
            log.info("   → Or POST /api/reviews with rideId: {}", ride.getId().toHexString());
        };
    }
}
