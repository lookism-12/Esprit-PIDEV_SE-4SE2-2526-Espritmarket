package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.DriverProfileRequestDTO;
import esprit_market.dto.carpooling.DriverProfileResponseDTO;
import esprit_market.dto.carpooling.DriverStatsDTO;
import esprit_market.dto.carpooling.MonthlyEarningDTO;
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
import esprit_market.mappers.carpooling.DriverProfileMapper;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DriverProfileService implements IDriverProfileService {

    private final DriverProfileRepository driverProfileRepository;
    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final RidePaymentRepository ridePaymentRepository;
    private final UserRepository userRepository;
    private final DriverProfileMapper driverProfileMapper;
    private final @Lazy IRideService rideService;
    private final @Lazy RatingService ratingService;

    public DriverProfileService(DriverProfileRepository driverProfileRepository,
                               RideRepository rideRepository,
                               BookingRepository bookingRepository,
                               RidePaymentRepository ridePaymentRepository,
                               UserRepository userRepository,
                               DriverProfileMapper driverProfileMapper,
                               @Lazy IRideService rideService,
                               @Lazy RatingService ratingService) {
        this.driverProfileRepository = driverProfileRepository;
        this.rideRepository = rideRepository;
        this.bookingRepository = bookingRepository;
        this.ridePaymentRepository = ridePaymentRepository;
        this.userRepository = userRepository;
        this.driverProfileMapper = driverProfileMapper;
        this.rideService = rideService;
        this.ratingService = ratingService;
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
                .isVerified(true)
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
    }

    public DriverStatsDTO getDriverStats(ObjectId driverProfileId) {
        DriverProfile driver = driverProfileRepository.findById(driverProfileId)
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        List<Ride> allRides = rideRepository.findByDriverProfileId(driverProfileId);
        List<ObjectId> rideIds = allRides.stream().map(Ride::getId).toList();
        List<Booking> allBookings = rideIds.isEmpty() ? new ArrayList<>() : bookingRepository.findByRideIdIn(rideIds);

        int totalRidesCreated = allRides.size();
        List<Ride> completedRides = allRides.stream()
                .filter(r -> r.getStatus() == RideStatus.COMPLETED)
                .toList();

        float totalEarnings = 0;
        float monthlyEarnings = 0;
        LocalDateTime now = LocalDateTime.now();
        Map<String, Float> trendMap = new TreeMap<>(); // Sorted by month YYYY-MM

        int acceptedBookings = 0;
        int totalRequests = 0;
        int pendingRequests = 0;

        for (Booking b : allBookings) {
            if (b.getStatus() == BookingStatus.PENDING) {
                pendingRequests++;
                continue;
            }

            totalRequests++;
            if (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED) {
                acceptedBookings++;
                
                // Calculate earnings for confirmed/completed bookings
                float amount = b.getTotalPrice() != null ? b.getTotalPrice() : 0f;
                totalEarnings += amount;

                // Monthly analytics grouping
                LocalDateTime date = b.getCreatedAt() != null ? b.getCreatedAt() : now;
                String monthKey = date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                trendMap.put(monthKey, trendMap.getOrDefault(monthKey, 0f) + amount);

                if (date.getMonth() == now.getMonth() && date.getYear() == now.getYear()) {
                    monthlyEarnings += amount;
                }
            }
        }

        // Acceptance Rate
        float acceptanceRate = totalRequests > 0 ? (float) acceptedBookings * 100 / totalRequests : 100f;

        // Score + Badge
        float score = ratingService.computeScore(
                driver.getAverageRating() != null ? driver.getAverageRating() : 0f,
                completedRides.size(),
                acceptanceRate);
        String badge = ratingService.computeBadge(score);

        // Structured Trend Data
        List<MonthlyEarningDTO> trend = trendMap.entrySet().stream()
                .map(e -> new MonthlyEarningDTO(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return DriverStatsDTO.builder()
                .totalRidesCreated(totalRidesCreated)
                .totalRidesCompleted(completedRides.size())
                .totalEarnings(totalEarnings)
                .monthlyEarnings(monthlyEarnings)
                .pendingRequests(pendingRequests)
                .acceptanceRate(acceptanceRate)
                .averageRating(driver.getAverageRating() != null ? driver.getAverageRating() : 0f)
                .driverScore(score)
                .badge(badge)
                .monthlyEarningsTrend(trend)
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
            // Recompute score and badge after ride count changes
            ratingService.updateDriverAverageRating(driverProfileId);
        }
    }

    @Override
    public DriverProfileResponseDTO getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return driverProfileMapper.toResponseDTO(driverProfileRepository.findByUserId(user.getId()).orElse(null));
    }

    @Override
    public DriverStatsDTO getMyDriverStats(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        Optional<DriverProfile> profileOpt = driverProfileRepository.findByUserId(user.getId());
        
        if (profileOpt.isEmpty()) {
            log.info("No driver profile found for user {}, returning empty stats", email);
            return DriverStatsDTO.builder()
                    .totalRidesCreated(0)
                    .totalRidesCompleted(0)
                    .totalEarnings(0f)
                    .monthlyEarnings(0f)
                    .pendingRequests(0)
                    .acceptanceRate(100f)
                    .averageRating(5.0f)
                    .monthlyEarningsTrend(new ArrayList<>())
                    .build();
        }
        
        return getDriverStats(profileOpt.get().getId());
    }

    @Override
    public long countUnverifiedDrivers() {
        return driverProfileRepository.countByIsVerifiedFalse();
    }
}
