package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.dto.carpooling.RideRequestDTO;
import esprit_market.dto.carpooling.RideResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.user.User;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.RidePaymentRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.VehicleRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationService;
import esprit_market.mappers.carpooling.RideMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RideService implements IRideService {

    private final RideRepository rideRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final BookingRepository bookingRepository;
    private final RidePaymentRepository ridePaymentRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final IPassengerProfileService passengerProfileService;
    private final IDriverProfileService driverProfileService;
    private final RatingService ratingService;
    private final RideMapper rideMapper;

    public RideService(RideRepository rideRepository,
                      VehicleRepository vehicleRepository,
                      DriverProfileRepository driverProfileRepository,
                      BookingRepository bookingRepository,
                      RidePaymentRepository ridePaymentRepository,
                      PassengerProfileRepository passengerProfileRepository,
                      UserRepository userRepository,
                      NotificationService notificationService,
                      @Lazy IPassengerProfileService passengerProfileService,
                      @Lazy IDriverProfileService driverProfileService,
                      RatingService ratingService,
                      RideMapper rideMapper) {
        this.rideRepository = rideRepository;
        this.vehicleRepository = vehicleRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.bookingRepository = bookingRepository;
        this.ridePaymentRepository = ridePaymentRepository;
        this.passengerProfileRepository = passengerProfileRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.passengerProfileService = passengerProfileService;
        this.driverProfileService = driverProfileService;
        this.ratingService = ratingService;
        this.rideMapper = rideMapper;
    }

    @Override
    public List<RideResponseDTO> findAll() {
        LocalDateTime now = LocalDateTime.now();
        return rideRepository.findAll().stream()
                // Passenger view: only active, non-expired rides, newest first
                .filter(r -> r.getStatus() == RideStatus.CONFIRMED || r.getStatus() == RideStatus.ACCEPTED)
                .filter(r -> r.getDepartureTime() != null && r.getDepartureTime().isAfter(now))
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .map(rideMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public RideResponseDTO findById(ObjectId id) {
        return rideMapper.toResponseDTO(rideRepository.findById(id).orElse(null));
    }

    @Override
    public RideResponseDTO save(Ride ride) {
        return rideMapper.toResponseDTO(rideRepository.save(ride));
    }

    @Override
    public RideResponseDTO update(ObjectId id, Ride ride) {
        Ride existing = rideRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));
        if (ride.getDepartureLocation() != null) {
            existing.setDepartureLocation(ride.getDepartureLocation());
        }
        if (ride.getDestinationLocation() != null) {
            existing.setDestinationLocation(ride.getDestinationLocation());
        }
        if (ride.getDepartureTime() != null) {
            existing.setDepartureTime(ride.getDepartureTime());
        }
        if (ride.getAvailableSeats() != null) {
            existing.setAvailableSeats(ride.getAvailableSeats());
        }
        if (ride.getPricePerSeat() != null) {
            existing.setPricePerSeat(ride.getPricePerSeat());
        }
        return rideMapper.toResponseDTO(rideRepository.save(existing));
    }

    @Override
    public void deleteById(ObjectId id) {
        rideRepository.deleteById(id);
    }

    @Override
    public List<RideResponseDTO> findByDriverProfileId(ObjectId driverProfileId) {
        return rideRepository.findByDriverProfileId(driverProfileId).stream()
                .map(rideMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public RideResponseDTO updateStatus(ObjectId id, RideStatus status) {
        Ride ride = rideRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        // Part 1 #7 & #8: State transition validation
        RideStatus current = ride.getStatus();
        if (current == RideStatus.COMPLETED || current == RideStatus.CANCELLED) {
            throw new IllegalStateException("Ride is already in a terminal state: " + current);
        }

        if (status == RideStatus.CANCELLED) {
            cancelRide(ride.getId().toHexString(), null); // reuse cancel logic
            return rideMapper.toResponseDTO(rideRepository.findById(ride.getId()).orElse(ride));
        }

        if (status == RideStatus.COMPLETED) {
            ride.setCompletedAt(LocalDateTime.now());
            // Trigger booking completion handled in scheduler usually, but if manual:
            List<Booking> bookings = bookingRepository.findByRideIdAndStatus(ride.getId(),
                    esprit_market.Enum.carpoolingEnum.BookingStatus.CONFIRMED);
            for (Booking b : bookings) {
                b.setStatus(esprit_market.Enum.carpoolingEnum.BookingStatus.COMPLETED);
                bookingRepository.save(b);
                // Synchronize payment status
                ridePaymentRepository.findByBookingId(b.getId()).ifPresent(p -> {
                    p.setStatus(esprit_market.Enum.carpoolingEnum.PaymentStatus.COMPLETED);
                    ridePaymentRepository.save(p);
                });
            }
        }

        ride.setStatus(status);
        return rideMapper.toResponseDTO(rideRepository.save(ride));
    }

    @Override
    public List<RideResponseDTO> findByFilters(String departureLocation, String destinationLocation,
            LocalDateTime departureTime,
            Integer availableSeats, RideStatus status, LocalDateTime postedSince, Pageable pageable) {
        return rideRepository.findAll().stream()
                .filter(r -> departureLocation == null || r.getDepartureLocation().equalsIgnoreCase(departureLocation))
                .filter(r -> destinationLocation == null
                        || r.getDestinationLocation().equalsIgnoreCase(destinationLocation))
                .filter(r -> departureTime == null || r.getDepartureTime().isAfter(departureTime)
                        || r.getDepartureTime().isEqual(departureTime))
                .filter(r -> availableSeats == null || r.getAvailableSeats() >= availableSeats)
                .filter(r -> status == null || r.getStatus() == status)
                .filter(r -> postedSince == null || (r.getCreatedAt() != null && !r.getCreatedAt().isBefore(postedSince)))
                .map(rideMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<RideResponseDTO> findByDriverUserId(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        DriverProfile driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));
        return rideRepository.findByDriverProfileId(driverProfile.getId()).stream()
                .map(rideMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    public List<RideResponseDTO> searchRides(String departureLocation, String destinationLocation,
            java.time.LocalDateTime departureTime, Integer requestedSeats, LocalDateTime postedSince) {
        LocalDateTime now = LocalDateTime.now();
        List<Ride> rides = rideRepository.findAll().stream()
                // Only active statuses
                .filter(r -> r.getStatus() == RideStatus.CONFIRMED || r.getStatus() == RideStatus.ACCEPTED)
                // Not expired: departureTime must be in the future
                .filter(r -> r.getDepartureTime() != null && r.getDepartureTime().isAfter(now))
                // Date filter: if provided, ride must depart on or after that time
                .filter(r -> departureTime == null || !r.getDepartureTime().isBefore(departureTime))
                // Posted Since filter
                .filter(r -> postedSince == null || (r.getCreatedAt() != null && !r.getCreatedAt().isBefore(postedSince)))
                // Seats
                .filter(r -> requestedSeats == null || r.getAvailableSeats() >= requestedSeats)
                // Departure: case-insensitive partial match
                .filter(r -> departureLocation == null || departureLocation.isBlank()
                        || r.getDepartureLocation().toLowerCase().contains(departureLocation.toLowerCase()))
                // Destination: case-insensitive partial match
                .filter(r -> destinationLocation == null || destinationLocation.isBlank()
                        || r.getDestinationLocation().toLowerCase().contains(destinationLocation.toLowerCase()))
                // Sort by createdAt descending (newest post first)
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .collect(Collectors.toList());
        return rides.stream().map(rideMapper::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<RideResponseDTO> getMyRides(String driverEmail) {
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        DriverProfile driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found. Register as driver first."));
        return rideRepository.findByDriverProfileId(driverProfile.getId()).stream()
                .map(rideMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public DriverProfile getDriverProfileByUserId(ObjectId userId) {
        if (userId == null)
            return null;
        return driverProfileRepository.findByUserId(userId).orElse(null);
    }

    @Transactional
    public RideResponseDTO createRide(RideRequestDTO dto, String driverEmail) {
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found. Register as driver first."));

        if (!Boolean.TRUE.equals(driverProfile.getIsVerified())) {
            throw new IllegalStateException("Your driver profile is not verified yet");
        }

        ObjectId vehicleId = new ObjectId(dto.getVehicleId());
        if (!vehicleRepository.existsByIdAndDriverProfileId(vehicleId, driverProfile.getId())) {
            throw new AccessDeniedException("Vehicle does not belong to this driver");
        }

        // Apply Dynamic Pricing
        Float computedPrice = computeDynamicPrice(
            dto.getDepartureLocation(), 
            dto.getDestinationLocation(), 
            dto.getDepartureTime(), 
            dto.getAvailableSeats(),
            dto.getDistanceKm() // Pass real distance if available
        );

        Ride ride = Ride.builder()
                .driverProfileId(driverProfile.getId())
                .vehicleId(vehicleId)
                .departureLocation(dto.getDepartureLocation())
                .destinationLocation(dto.getDestinationLocation())
                .departureTime(dto.getDepartureTime())
                .availableSeats(dto.getAvailableSeats())
                .pricePerSeat(computedPrice) // Override user input
                .status(RideStatus.CONFIRMED)
                .build();
        ride = rideRepository.save(ride);

        if (driverProfile.getRideIds() == null) {
            driverProfile.setRideIds(new java.util.ArrayList<>());
        }
        driverProfile.getRideIds().add(ride.getId());
        driverProfileRepository.save(driverProfile);

        return rideMapper.toResponseDTO(ride);
    }

    /**
     * Deterministic Dynamic Pricing Logic
     * Price = (Distance Proxy * Rate) * (Multipliers: Peak, Demand, Seats)
     */
    private Float computeDynamicPrice(String from, String to, LocalDateTime time, Integer seats, Double realDistanceKm) {
        // 1. Distance Proxy or Real Distance
        double distanceKm;
        if (realDistanceKm != null && realDistanceKm > 0) {
            distanceKm = realDistanceKm;
        } else {
            // Fallback to deterministic proxy based on location string lengths
            distanceKm = (from.trim().length() + to.trim().length()) * 1.5;
        }
        
        double ratePerKm = 0.12;
        double basePrice = distanceKm * ratePerKm;

        // 2. Peak Hour Multiplier (Deterministic based on time)
        int hour = time.getHour();
        double peakMultiplier = ( (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ) ? 1.25 : 1.0;

        // 3. Demand Multiplier (Dynamic but deterministic based on current state)
        // Check for ride requests on similar route
        long requests = rideRepository.findAll().stream()
                .filter(r -> r.getDepartureLocation().equalsIgnoreCase(from) && r.getDestinationLocation().equalsIgnoreCase(to))
                .count(); 
        double demandMultiplier = 1.0 + Math.min(requests * 0.05, 0.4); // Max +40%

        // 4. Seat Scarcity Multiplier
        double seatMultiplier = (seats != null && seats <= 2) ? 1.15 : 1.0;

        // Final Calculation
        double finalPrice = basePrice * peakMultiplier * demandMultiplier * seatMultiplier;

        // Min/Max Caps (3 TND to 60 TND)
        finalPrice = Math.max(3.0, Math.min(finalPrice, 60.0));
        
        // Round to 1 decimal place and cast to Float
        return (float) (Math.round(finalPrice * 10.0) / 10.0);
    }

    @Transactional
    public RideResponseDTO updateRide(String rideId, RideRequestDTO dto, String driverEmail) {
        Ride ride = rideRepository.findById(new ObjectId(rideId))
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        if (!ride.getDriverProfileId().equals(driverProfile.getId())) {
            throw new AccessDeniedException("Only the ride owner can update this ride");
        }

        // Logic improvement: Prevent critical updates if bookings exist
        long activeBookings = bookingRepository.findByRideId(ride.getId()).stream()
                .filter(b -> b.getStatus() == esprit_market.Enum.carpoolingEnum.BookingStatus.CONFIRMED ||
                        b.getStatus() == esprit_market.Enum.carpoolingEnum.BookingStatus.PENDING)
                .count();

        if (activeBookings > 0) {
            boolean criticalChange = !ride.getDepartureLocation().equals(dto.getDepartureLocation()) ||
                    !ride.getDestinationLocation().equals(dto.getDestinationLocation()) ||
                    !ride.getDepartureTime().equals(dto.getDepartureTime()) ||
                    !ride.getPricePerSeat().equals(dto.getPricePerSeat());

            if (criticalChange) {
                throw new IllegalStateException(
                        "Cannot change departure/destination, time, or price because active bookings exist. Cancel the ride instead.");
            }

            int confirmedSeats = bookingRepository.findByRideId(ride.getId()).stream()
                    .filter(b -> b.getStatus() == esprit_market.Enum.carpoolingEnum.BookingStatus.CONFIRMED)
                    .mapToInt(b -> b.getNumberOfSeats())
                    .sum();

            if (dto.getAvailableSeats() < confirmedSeats) {
                throw new IllegalStateException(
                        "Available seats cannot be less than already confirmed seats (" + confirmedSeats + ")");
            }
        }

        ObjectId vehicleId = new ObjectId(dto.getVehicleId());
        if (!vehicleRepository.existsByIdAndDriverProfileId(vehicleId, driverProfile.getId())) {
            throw new AccessDeniedException("Vehicle does not belong to this driver");
        }

        ride.setVehicleId(vehicleId);
        ride.setDepartureLocation(dto.getDepartureLocation());
        ride.setDestinationLocation(dto.getDestinationLocation());
        ride.setDepartureTime(dto.getDepartureTime());
        ride.setAvailableSeats(dto.getAvailableSeats());

        // Recalculate Dynamic Price
        Float updatedPrice = computeDynamicPrice(
            dto.getDepartureLocation(), 
            dto.getDestinationLocation(), 
            dto.getDepartureTime(), 
            dto.getAvailableSeats(),
            dto.getDistanceKm()
        );
        ride.setPricePerSeat(updatedPrice); 

        ride = rideRepository.save(ride);
        return rideMapper.toResponseDTO(ride);
    }

    @Transactional
    public void cancelRide(String rideId, String driverEmail) {
        Ride ride = rideRepository.findById(new ObjectId(rideId))
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        if (!ride.getDriverProfileId().equals(driverProfile.getId())) {
            throw new AccessDeniedException("Only the ride owner can cancel this ride");
        }

        ride.setStatus(RideStatus.CANCELLED);
        // Fix Part 1 #4: redundant availableSeats update removed. Redundant save will
        // be handled by final save.

        List<Booking> bookings = bookingRepository.findByRideId(ride.getId());
        List<ObjectId> passengerUserIds = new ArrayList<>();
        for (Booking b : bookings) {
            b.setStatus(esprit_market.Enum.carpoolingEnum.BookingStatus.CANCELLED);
            bookingRepository.save(b);
            // ride.setAvailableSeats(ride.getAvailableSeats() + b.getNumberOfSeats()); //
            // Fixed: Remove pointless restoration
            PassengerProfile passengerProfile = passengerProfileRepository.findById(b.getPassengerProfileId())
                    .orElse(null);
            if (passengerProfile != null)
                passengerUserIds.add(passengerProfile.getUserId());
            ridePaymentRepository.findByBookingId(b.getId()).ifPresent(payment -> {
                payment.setStatus(esprit_market.Enum.carpoolingEnum.PaymentStatus.REFUNDED);
                ridePaymentRepository.save(payment);
            });
        }
        rideRepository.save(ride); // Final save

        if (!passengerUserIds.isEmpty()) {
            notificationService.notifyUsers(passengerUserIds, "Ride Cancelled",
                    "Your ride from " + ride.getDepartureLocation() + " to " + ride.getDestinationLocation()
                            + " has been cancelled.");
        }
    }

    @Override
    @Transactional
    public void processStatusTransitions() {
        LocalDateTime now = LocalDateTime.now();

        // 1. CONFIRMED -> IN_PROGRESS
        List<Ride> confirmedRides = rideRepository.findByStatusAndDepartureTimeBefore(RideStatus.CONFIRMED, now);
        for (Ride ride : confirmedRides) {
            ride.setStatus(RideStatus.IN_PROGRESS);
            rideRepository.save(ride);

            // Cancel any remaining PENDING bookings when ride starts
            List<Booking> pendingBookings = bookingRepository.findByRideIdAndStatus(ride.getId(),
                    esprit_market.Enum.carpoolingEnum.BookingStatus.PENDING);
            for (Booking b : pendingBookings) {
                b.setStatus(esprit_market.Enum.carpoolingEnum.BookingStatus.CANCELLED);
                bookingRepository.save(b);
                log.debug("Pending booking {} cancelled because ride {} started", b.getId(), ride.getId());
            }
            log.debug("Ride {} transitioned to IN_PROGRESS", ride.getId());
        }

        // 2. IN_PROGRESS -> COMPLETED
        List<Ride> inProgressRides = rideRepository.findByStatus(RideStatus.IN_PROGRESS);
        for (Ride ride : inProgressRides) {
            int duration = ride.getEstimatedDurationMinutes() != null ? ride.getEstimatedDurationMinutes() : 120;
            if (ride.getDepartureTime().plusMinutes(duration).isBefore(now)) {
                ride.setStatus(RideStatus.COMPLETED);
                ride.setCompletedAt(now);
                rideRepository.save(ride);

                List<Booking> bookings = bookingRepository.findByRideIdAndStatus(ride.getId(),
                        esprit_market.Enum.carpoolingEnum.BookingStatus.CONFIRMED);
                float totalEarnings = 0;
                for (Booking b : bookings) {
                    b.setStatus(esprit_market.Enum.carpoolingEnum.BookingStatus.COMPLETED);
                    bookingRepository.save(b);

                    passengerProfileService.incrementTotalRides(b.getPassengerProfileId());

                    ridePaymentRepository.findByBookingId(b.getId()).ifPresent(payment -> {
                        payment.setStatus(esprit_market.Enum.carpoolingEnum.PaymentStatus.COMPLETED);
                        ridePaymentRepository.save(payment);
                    });
                    totalEarnings += b.getTotalPrice() != null ? b.getTotalPrice() : 0;
                }
                driverProfileService.incrementTotalRidesAndEarnings(ride.getDriverProfileId(), totalEarnings);
                log.debug("Ride {} transitioned to COMPLETED", ride.getId());
            }
        }
    }

    @Override
    public long countActiveRides() {
        return rideRepository.countByStatusIn(java.util.List.of(RideStatus.ACCEPTED, RideStatus.ON_ROUTE, RideStatus.IN_PROGRESS));
    }

    @Override
    @Transactional
    public void rateRide(String rideId, Integer rating, String comment, boolean isDriverRating) {
        if (rating < 1 || rating > 5) throw new IllegalArgumentException("Rating must be between 1 and 5");

        Ride ride = rideRepository.findById(new ObjectId(rideId))
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        if (isDriverRating) {
            ride.setDriverRating(rating);
            ride.setDriverComment(comment);
            rideRepository.save(ride);
            ratingService.updateDriverAverageRating(ride.getDriverProfileId());
            driverProfileRepository.findById(ride.getDriverProfileId())
                    .flatMap(dp -> userRepository.findById(dp.getUserId()))
                    .ifPresent(driverUser -> notificationService.sendNotification(driverUser,
                            "New Driver Rating ⭐",
                            "You received a " + rating + "-star rating!" + (comment != null && !comment.isEmpty() ? " Comment: " + comment : ""),
                            esprit_market.Enum.notificationEnum.NotificationType.RIDE_UPDATE, rideId));
        } else {
            ride.setPassengerRating(rating);
            ride.setPassengerComment(comment);
            rideRepository.save(ride);
            bookingRepository.findByRideId(ride.getId()).stream().findFirst().ifPresent(b -> {
                ratingService.updatePassengerAverageRating(b.getPassengerProfileId());
                passengerProfileRepository.findById(b.getPassengerProfileId())
                        .flatMap(pp -> userRepository.findById(pp.getUserId()))
                        .ifPresent(passengerUser -> notificationService.sendNotification(passengerUser,
                                "New Passenger Rating ⭐",
                                "You received a " + rating + "-star rating!" + (comment != null && !comment.isEmpty() ? " Comment: " + comment : ""),
                                esprit_market.Enum.notificationEnum.NotificationType.RIDE_UPDATE, rideId));
            });
        }
    }

    @Override
    public java.util.Map<String, Long> getMonthlyRidesTrend() {
        return rideRepository.getMonthlyRidesTrend().stream()
                .collect(java.util.stream.Collectors.toMap(
                        esprit_market.dto.carpooling.stats.AggregationResult::getId,
                        esprit_market.dto.carpooling.stats.AggregationResult::getCount,
                        (v1, v2) -> v1,
                        java.util.TreeMap::new
                ));
    }

    @Override
    public java.util.Map<String, Long> getStatusDistribution() {
        return rideRepository.getStatusDistribution().stream()
                .collect(java.util.stream.Collectors.toMap(
                        r -> r.getId() != null ? r.getId() : "UNKNOWN",
                        esprit_market.dto.carpooling.stats.AggregationResult::getCount
                ));
    }

    @Override
    public java.util.List<esprit_market.dto.carpooling.RouteStatDTO> getTopRoutes() {
        return rideRepository.getTopRoutes().stream()
                .map(r -> new esprit_market.dto.carpooling.RouteStatDTO(r.getId(), r.getCount()))
                .collect(java.util.stream.Collectors.toList());
    }
}
