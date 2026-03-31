package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.DriverProfileRequestDTO;
import esprit_market.dto.carpooling.DriverProfileResponseDTO;
import esprit_market.dto.carpooling.DriverStatsDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.Ride;
// RidePayment entity import removed as it might be unused or duplicate
import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.Enum.userEnum.Role;
import esprit_market.entity.user.User;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.repository.carpoolingRepository.RidePaymentRepository;
import esprit_market.repository.carpoolingRepository.RideRequestRepository;
import esprit_market.mappers.carpooling.DriverProfileMapper;
import esprit_market.service.notificationService.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DriverProfileService implements IDriverProfileService {

    private final DriverProfileRepository driverProfileRepository;
    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final RidePaymentRepository ridePaymentRepository;
    private final RideRequestRepository rideRequestRepository;
    private final UserRepository userRepository;
    private final DriverProfileMapper driverProfileMapper;
    private final @Lazy IRideService rideService;
    private final NotificationService notificationService;

    public DriverProfileService(DriverProfileRepository driverProfileRepository,
            RideRepository rideRepository,
            BookingRepository bookingRepository,
            RidePaymentRepository ridePaymentRepository,
            RideRequestRepository rideRequestRepository,
            UserRepository userRepository,
            DriverProfileMapper driverProfileMapper,
            @Lazy IRideService rideService,
            NotificationService notificationService) {
        this.driverProfileRepository = driverProfileRepository;
        this.rideRepository = rideRepository;
        this.bookingRepository = bookingRepository;
        this.ridePaymentRepository = ridePaymentRepository;
        this.rideRequestRepository = rideRequestRepository;
        this.userRepository = userRepository;
        this.driverProfileMapper = driverProfileMapper;
        this.rideService = rideService;
        this.notificationService = notificationService;
    }

    public DriverProfileResponseDTO registerDriver(DriverProfileRequestDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (driverProfileRepository.existsByUserId(user.getId())) {
            throw new IllegalStateException("Driver profile already exists for this user");
        }
        DriverProfile profile = DriverProfile.builder()
                .userId(user.getId())
                .licenseNumber(dto.getLicenseNumber())
                .licenseDocument(dto.getLicenseDocument())
                .isVerified(false)
                .averageRating(0f)
                .totalRidesCompleted(0)
                .totalEarnings(0f)
                .build();
        profile = driverProfileRepository.save(profile);
        user.setDriverProfileId(profile.getId());
        if (user.getRoles() != null && !user.getRoles().contains(Role.DRIVER)) {
            user.getRoles().add(Role.DRIVER);
        } else if (user.getRoles() == null) {
            user.setRoles(java.util.List.of(Role.DRIVER));
        }
        userRepository.save(user);
        
        // Notify admins about the new driver registration
        notificationService.notifyAllAdmins(
                "New Driver Registered 🚗",
                "A new driver (" + user.getFirstName() + " " + user.getLastName() 
                        + ") has registered with license number: " + dto.getLicenseNumber() + ".",
                esprit_market.Enum.notificationEnum.NotificationType.RIDE_UPDATE,
                profile.getId().toHexString()
        );
        
        return driverProfileMapper.toResponseDTO(profile);
    }

    @Override
    public List<DriverProfileResponseDTO> findAll() {
        return driverProfileRepository.findAll().stream()
                .map(driverProfileMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public DriverProfileResponseDTO findById(ObjectId id) {
        return driverProfileMapper.toResponseDTO(driverProfileRepository.findById(id).orElse(null));
    }

    @Override
    public DriverProfileResponseDTO findByUserId(ObjectId userId) {
        return driverProfileMapper.toResponseDTO(driverProfileRepository.findByUserId(userId).orElse(null));
    }

    @Override
    public DriverProfile save(DriverProfile profile) {
        return driverProfileRepository.save(profile);
    }

    @Override
    public DriverProfileResponseDTO update(ObjectId id, DriverProfile profile) {
        DriverProfile existing = driverProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        existing.setLicenseNumber(profile.getLicenseNumber());
        existing.setLicenseDocument(profile.getLicenseDocument());
        return driverProfileMapper.toResponseDTO(driverProfileRepository.save(existing));
    }

    @Override
    @Transactional
    public void delete(ObjectId id) {
        DriverProfile profile = driverProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        // Part 2 #3: Cascade delete logic for DriverProfile
        // 1. Find all rides associated with this driver
        List<esprit_market.entity.carpooling.Ride> rides = rideRepository.findByDriverProfileId(id);
        User driverUser = userRepository.findById(profile.getUserId()).orElse(null);
        String driverEmail = driverUser != null ? driverUser.getEmail() : null;

        for (esprit_market.entity.carpooling.Ride ride : rides) {
            // Cancel ride which also cancels bookings
            if (ride.getStatus() != esprit_market.Enum.carpoolingEnum.RideStatus.CANCELLED &&
                    ride.getStatus() != esprit_market.Enum.carpoolingEnum.RideStatus.COMPLETED) {
                rideService.cancelRide(ride.getId().toHexString(), driverEmail);
            }
        }

        // 2. Remove DRIVER role from User
        userRepository.findById(profile.getUserId()).ifPresent(user -> {
            if (user.getRoles() != null) {
                user.getRoles().remove(esprit_market.Enum.userEnum.Role.DRIVER);
                userRepository.save(user);
            }
        });

        // 3. Delete Profile
        driverProfileRepository.deleteById(id);
    }

    public void verifyDriver(ObjectId id) {
        DriverProfile driver = driverProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));
        driver.setIsVerified(true);
        driverProfileRepository.save(driver);

        // Notify the driver that their profile has been verified
        userRepository.findById(driver.getUserId()).ifPresent(driverUser ->
                notificationService.sendNotification(
                        driverUser,
                        "Profile Verified ✅",
                        "Congratulations! Your driver profile has been verified. You can now create rides and accept passengers.",
                        esprit_market.Enum.notificationEnum.NotificationType.RIDE_UPDATE,
                        id.toHexString()
                )
        );
    }

    @Override
    public long countUnverifiedDrivers() {
        return driverProfileRepository.countByIsVerifiedFalse();
    }

    public DriverStatsDTO getDriverStats(ObjectId driverProfileId) {
        DriverProfile driver = driverProfileRepository.findById(driverProfileId)
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime since = now.minusDays(30);

        List<Ride> completedRides = rideRepository.findByDriverProfileId(driverProfileId).stream()
                .filter(r -> r.getStatus() == RideStatus.COMPLETED)
                .toList();

        int recentCompleted = (int) completedRides.stream()
                .filter(r -> r.getCompletedAt() != null && r.getCompletedAt().isAfter(since))
                .count();

        float totalEarnings = 0;
        for (Ride ride : completedRides) {
            List<Booking> bookings = bookingRepository.findByRideIdAndStatus(ride.getId(), BookingStatus.COMPLETED);
            for (Booking b : bookings) {
                var payment = ridePaymentRepository.findByBookingId(b.getId());
                if (payment.isPresent()
                        && payment.get().getStatus() == esprit_market.Enum.carpoolingEnum.PaymentStatus.COMPLETED) {
                    totalEarnings += payment.get().getAmount();
                }
            }
        }

        return DriverStatsDTO.builder()
                .totalRidesCompleted(completedRides.size())
                .recentRidesCompleted(recentCompleted)
                .averageRating(driver.getAverageRating() != null ? driver.getAverageRating() : 0f)
                .totalEarnings(totalEarnings)
                .directRequestsCount(rideRequestRepository.countByStatus(esprit_market.Enum.carpoolingEnum.RideRequestStatus.PENDING))
                .build();
    }

    @Override
    public void incrementTotalRidesAndEarnings(ObjectId driverProfileId, float earnings) {
        DriverProfile driver = driverProfileRepository.findById(driverProfileId).orElse(null);
        if (driver != null) {
            driver.setTotalRidesCompleted(
                    driver.getTotalRidesCompleted() != null ? driver.getTotalRidesCompleted() + 1 : 1);
            driver.setTotalEarnings(
                    driver.getTotalEarnings() != null ? driver.getTotalEarnings() + earnings : earnings);
            driverProfileRepository.save(driver);
        }
    }

    @Override
    public DriverProfileResponseDTO getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return driverProfileMapper.toResponseDTO(driverProfileRepository.findByUserId(user.getId()).orElse(null));
    }
}
