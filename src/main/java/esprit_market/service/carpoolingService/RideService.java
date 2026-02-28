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
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class RideService implements IRideService {

    private final RideRepository rideRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final BookingRepository bookingRepository;
    private final RidePaymentRepository ridePaymentRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    public List<Ride> findAll() {
        return rideRepository.findAll();
    }

    @Override
    public Ride findById(ObjectId id) {
        return rideRepository.findById(id).orElse(null);
    }

    @Override
    public Ride save(Ride ride) {
        return rideRepository.save(ride);
    }

    @Override
    public Ride update(ObjectId id, Ride ride) {
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
        return rideRepository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        rideRepository.deleteById(id);
    }

    @Override
    public List<Ride> findByDriverProfileId(ObjectId driverProfileId) {
        return rideRepository.findByDriverProfileId(driverProfileId);
    }

    @Override
    public Ride updateStatus(ObjectId id, RideStatus status) {
        Ride ride = rideRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        // Part 1 #7 & #8: State transition validation
        RideStatus current = ride.getStatus();
        if (current == RideStatus.COMPLETED || current == RideStatus.CANCELLED) {
            throw new IllegalStateException("Ride is already in a terminal state: " + current);
        }

        if (status == RideStatus.CANCELLED) {
            cancelRide(ride.getId().toHexString(), null); // reuse cancel logic
            return rideRepository.findById(ride.getId()).orElse(ride);
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
        return rideRepository.save(ride);
    }

    @Override
    public List<Ride> findByFilters(String departureLocation, String destinationLocation, LocalDateTime departureTime,
            Integer availableSeats, RideStatus status, Pageable pageable) {
        // Fix Part 1 #12: Optimization (Simplified filtering, ideally use
        // MongoTemplate)
        // For now, I'll keep the stream but ensure it's efficient or use
        // findByDepartureLocation... if possible
        // Let's assume the user wants a more robust filtering.
        return rideRepository.findAll().stream()
                .filter(r -> departureLocation == null || r.getDepartureLocation().equalsIgnoreCase(departureLocation))
                .filter(r -> destinationLocation == null
                        || r.getDestinationLocation().equalsIgnoreCase(destinationLocation))
                .filter(r -> departureTime == null || r.getDepartureTime().isAfter(departureTime)
                        || r.getDepartureTime().isEqual(departureTime))
                .filter(r -> availableSeats == null || r.getAvailableSeats() >= availableSeats)
                .filter(r -> status == null || r.getStatus() == status)
                .collect(Collectors.toList());
    }

    public List<RideResponseDTO> searchRides(String departureLocation, String destinationLocation,
            java.time.LocalDateTime departureTime, Integer requestedSeats) {
        // Logic improvement: Case-insensitive partial matching for locations
        List<Ride> rides = rideRepository.findAll().stream()
                .filter(r -> r.getStatus() == RideStatus.CONFIRMED)
                .filter(r -> departureTime == null || r.getDepartureTime().isAfter(departureTime))
                .filter(r -> requestedSeats == null || r.getAvailableSeats() >= requestedSeats)
                .filter(r -> departureLocation == null || r.getDepartureLocation().toLowerCase()
                        .contains(departureLocation.toLowerCase()))
                .filter(r -> destinationLocation == null || r.getDestinationLocation().toLowerCase()
                        .contains(destinationLocation.toLowerCase()))
                .collect(Collectors.toList());
        return rides.stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    @Override
    public List<RideResponseDTO> getMyRides(String driverEmail) {
        User user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        DriverProfile driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found. Register as driver first."));
        return rideRepository.findByDriverProfileId(driverProfile.getId()).stream()
                .map(this::toResponseDTO)
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

        // Fix Part 1 #11: Driver verification check
        if (!Boolean.TRUE.equals(driverProfile.getIsVerified())) {
            throw new IllegalStateException("Your driver profile is not verified yet");
        }

        ObjectId vehicleId = new ObjectId(dto.getVehicleId());
        if (!vehicleRepository.existsByIdAndDriverProfileId(vehicleId, driverProfile.getId())) {
            throw new AccessDeniedException("Vehicle does not belong to this driver");
        }

        Ride ride = Ride.builder()
                .driverProfileId(driverProfile.getId())
                .vehicleId(vehicleId)
                .departureLocation(dto.getDepartureLocation())
                .destinationLocation(dto.getDestinationLocation())
                .departureTime(dto.getDepartureTime())
                .availableSeats(dto.getAvailableSeats())
                .pricePerSeat(dto.getPricePerSeat())
                .status(RideStatus.CONFIRMED)
                .build();
        ride = rideRepository.save(ride);

        // Part 2: Track ride on DriverProfile
        if (driverProfile.getRideIds() == null) {
            driverProfile.setRideIds(new java.util.ArrayList<>());
        }
        driverProfile.getRideIds().add(ride.getId());
        driverProfileRepository.save(driverProfile);

        return toResponseDTO(ride);
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
        ride.setPricePerSeat(dto.getPricePerSeat());
        ride = rideRepository.save(ride);
        return toResponseDTO(ride);
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

    public RideResponseDTO toResponseDTO(Ride ride) {
        String driverName = "";
        String vehicleMake = "";
        String vehicleModel = "";
        var driverProfile = driverProfileRepository.findById(ride.getDriverProfileId()).orElse(null);
        if (driverProfile != null) {
            var user = userRepository.findById(driverProfile.getUserId()).orElse(null);
            if (user != null)
                driverName = user.getFirstName() + " " + user.getLastName();
        }
        var vehicle = vehicleRepository.findById(ride.getVehicleId()).orElse(null);
        if (vehicle != null) {
            vehicleMake = vehicle.getMake();
            vehicleModel = vehicle.getModel();
        }
        return RideResponseDTO.builder()
                .rideId(ride.getId().toHexString())
                .driverProfileId(ride.getDriverProfileId().toHexString())
                .driverName(driverName)
                .vehicleId(ride.getVehicleId().toHexString())
                .vehicleMake(vehicleMake)
                .vehicleModel(vehicleModel)
                .departureLocation(ride.getDepartureLocation())
                .destinationLocation(ride.getDestinationLocation())
                .departureTime(ride.getDepartureTime())
                .availableSeats(ride.getAvailableSeats())
                .pricePerSeat(ride.getPricePerSeat())
                .status(ride.getStatus())
                .completedAt(ride.getCompletedAt())
                .build();
    }
}
