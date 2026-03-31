package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.dto.carpooling.BookingRequestDTO;
import esprit_market.dto.carpooling.BookingResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.carpooling.RidePayment;
import esprit_market.entity.user.User;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RidePaymentRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.mappers.carpooling.BookingMapper;
import esprit_market.service.notificationService.NotificationService;
import esprit_market.Enum.notificationEnum.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService implements IBookingService {

    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final RidePaymentRepository ridePaymentRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;
    private final DriverProfileRepository driverProfileRepository;
    private final NotificationService notificationService;

    /**
     * Calculate actual available seats for a ride based on confirmed bookings
     * Instead of relying on ride.availableSeats (which can get out of sync),
     * this calculates seats dynamically from confirmed bookings
     * 
     * Formula: totalCapacity (4) - sum of confirmed booking seats
     */
    public int getActualAvailableSeats(ObjectId rideId) {
        int totalCapacity = 4;  // Standard car capacity
        int bookedSeats = bookingRepository.findByRideId(rideId).stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .mapToInt(Booking::getNumberOfSeats)
                .sum();
        int actualAvailable = totalCapacity - bookedSeats;
        log.debug("💺 Ride {}: Total capacity={}, Booked seats={}, Actual available={}", 
                rideId, totalCapacity, bookedSeats, actualAvailable);
        return Math.max(0, actualAvailable);  // Prevent negative seats
    }

    @Override
    public List<BookingResponseDTO> findAll() {
        return bookingRepository.findAll().stream()
                .map(bookingMapper::toResponseDTO)
                .toList();
    }

    @Override
    public Booking save(Booking booking) {
        return bookingRepository.save(booking);
    }

    @Override
    public BookingResponseDTO findById(ObjectId id) {
        return bookingMapper.toResponseDTO(bookingRepository.findById(id).orElse(null));
    }

    @Override
    public void deleteById(ObjectId id) {
        bookingRepository.deleteById(id);
    }

    @Override
    public List<BookingResponseDTO> findByRideId(ObjectId rideId) {
        return bookingRepository.findByRideId(rideId).stream()
                .map(bookingMapper::toResponseDTO)
                .toList();
    }

    @Override
    public List<BookingResponseDTO> findByPassengerProfileId(ObjectId passengerProfileId) {
        return bookingRepository.findByPassengerProfileId(passengerProfileId).stream()
                .map(bookingMapper::toResponseDTO)
                .toList();
    }

    @Override
    public List<BookingResponseDTO> findByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status).stream()
                .map(bookingMapper::toResponseDTO)
                .toList();
    }

    @Override
    public List<BookingResponseDTO> findByPassengerUserId(ObjectId userId) {
        var passengerProfile = passengerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
        return findByPassengerProfileId(passengerProfile.getId());
    }

    @Override
    public List<BookingResponseDTO> findMyBookings(String userEmail) {
        var user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var passengerProfile = passengerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
        return findByPassengerProfileId(passengerProfile.getId());
    }

    @Override
    public BookingResponseDTO update(ObjectId id, BookingRequestDTO dto, String passengerEmail) {
        var user = userRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var passengerProfile = passengerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));

        Booking existing = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!existing.getPassengerProfileId().equals(passengerProfile.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the booking owner can update this booking");
        }

        if (dto.getNumberOfSeats() != null && !dto.getNumberOfSeats().equals(existing.getNumberOfSeats())) {
            Ride ride = rideRepository.findById(existing.getRideId()).orElse(null);
            if (ride != null) {
                int delta = dto.getNumberOfSeats() - existing.getNumberOfSeats();
                if (ride.getAvailableSeats() < delta) {
                    throw new IllegalStateException("Not enough seats available");
                }
                ride.setAvailableSeats(ride.getAvailableSeats() - delta);
                rideRepository.save(ride);
            }
            existing.setNumberOfSeats(dto.getNumberOfSeats());
        }
        if (dto.getPickupLocation() != null) {
            existing.setPickupLocation(dto.getPickupLocation());
        }
        if (dto.getDropoffLocation() != null) {
            existing.setDropoffLocation(dto.getDropoffLocation());
        }
        return bookingMapper.toResponseDTO(bookingRepository.save(existing));
    }

    @Override
    public BookingResponseDTO updateStatus(ObjectId id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        booking.setStatus(status);

        // Part 2: Logical additions
        if (status == BookingStatus.CONFIRMED) {
            // Send notification to passenger
            // notificationService.notifyUser(booking.getPassengerProfileId(), "Booking
            // Confirmed", "Your booking has been confirmed.");
        }

        return bookingMapper.toResponseDTO(bookingRepository.save(booking));
    }

    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO dto, String passengerEmail, ObjectId rideId) {
        var user = userRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var passengerProfile = passengerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Passenger profile not found. Register as passenger first."));
        ObjectId passengerProfileId = passengerProfile.getId();

        Ride ride = rideRepository.findById(rideId).orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        if (ride.getStatus() != esprit_market.Enum.carpoolingEnum.RideStatus.CONFIRMED
                && ride.getStatus() != esprit_market.Enum.carpoolingEnum.RideStatus.ACCEPTED) {
            throw new IllegalStateException("Ride is not available for booking");
        }

        // Logic improvement: Prevent self-booking
        if (ride.getDriverProfileId().equals(passengerProfileId)) {
            throw new IllegalStateException("Drivers cannot book their own rides");
        }

        // IMPROVEMENT #1: Real-time seat management - check actual available seats
        int actualAvailableSeats = getActualAvailableSeats(rideId);
        if (dto.getNumberOfSeats() > actualAvailableSeats) {
            log.warn("❌ Booking denied: Not enough seats. Requested: {}, Actual available: {}", 
                    dto.getNumberOfSeats(), actualAvailableSeats);
            throw new IllegalStateException("Not enough available seats. Requested: " + dto.getNumberOfSeats()
                    + ", Available: " + actualAvailableSeats);
        }

        log.info("✓ Booking approved: {} seat(s) available for ride {}", 
                actualAvailableSeats - dto.getNumberOfSeats(), rideId);
        
        Float totalPrice = dto.getNumberOfSeats() * ride.getPricePerSeat();
        Booking booking = Booking.builder()
                .rideId(rideId)
                .passengerProfileId(passengerProfileId)
                .numberOfSeats(dto.getNumberOfSeats())
                .pickupLocation(dto.getPickupLocation())
                .dropoffLocation(dto.getDropoffLocation())
                .status(BookingStatus.PENDING) // Fix Part 1 #2: starts as PENDING
                .totalPrice(totalPrice)
                .build();
        final Booking savedBooking = bookingRepository.save(booking);

        // Part 2: Track booking on PassengerProfile
        passengerProfileRepository.findById(passengerProfileId).ifPresent(profile -> {
            if (profile.getBookingIds() == null) {
                profile.setBookingIds(new java.util.ArrayList<>());
            }
            profile.getBookingIds().add(savedBooking.getId());
            passengerProfileRepository.save(profile);
        });

        ride.setAvailableSeats(ride.getAvailableSeats() - dto.getNumberOfSeats());
        rideRepository.save(ride);

        RidePayment payment = esprit_market.entity.carpooling.RidePayment.builder()
                .bookingId(savedBooking.getId())
                .amount(totalPrice)
                .status(esprit_market.Enum.carpoolingEnum.PaymentStatus.PENDING)
                .build();
        ridePaymentRepository.save(payment);

        // Notify the passenger that their booking is pending driver approval
        notificationService.sendNotification(
                user,
                "Booking Submitted 🎫",
                "Your booking for the ride from " + ride.getDepartureLocation()
                        + " to " + ride.getDestinationLocation() + " is pending driver approval.",
                NotificationType.RIDE_UPDATE,
                savedBooking.getId().toHexString()
        );

        // Notify the driver that a new booking request arrived
        driverProfileRepository.findById(ride.getDriverProfileId()).ifPresent(driverProfile ->
                userRepository.findById(driverProfile.getUserId()).ifPresent(driverUser ->
                        notificationService.sendNotification(
                                driverUser,
                                "New Booking Request 🚗",
                                user.getFirstName() + " " + user.getLastName()
                                        + " wants to book " + dto.getNumberOfSeats() + " seat(s) on your ride from "
                                        + ride.getDepartureLocation() + " to " + ride.getDestinationLocation() + ".",
                                NotificationType.RIDE_UPDATE,
                                savedBooking.getId().toHexString()
                        )
                )
        );

        return bookingMapper.toResponseDTO(savedBooking);
    }

    @Transactional
    public void cancelBooking(String bookingId, String passengerEmail) {
        var user = userRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var passengerProfile = passengerProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));

        Booking booking = bookingRepository.findById(new ObjectId(bookingId))
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getPassengerProfileId().equals(passengerProfile.getId())) {
            throw new AccessDeniedException("Only the booking owner can cancel");
        }
        // Fix Part 1 #3: Allow cancelling any non-terminal status (PENDING or
        // CONFIRMED)
        if (booking.getStatus() == BookingStatus.CANCELLED || booking.getStatus() == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Booking cannot be cancelled from status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(java.time.LocalDateTime.now());
        bookingRepository.save(booking);

        Ride ride = rideRepository.findById(booking.getRideId()).orElse(null);
        if (ride != null) {
            ride.setAvailableSeats(ride.getAvailableSeats() + booking.getNumberOfSeats());
            rideRepository.save(ride);
        }

        ridePaymentRepository.findByBookingId(booking.getId()).ifPresent(payment -> {
            payment.setStatus(esprit_market.Enum.carpoolingEnum.PaymentStatus.REFUNDED);
            ridePaymentRepository.save(payment);
        });
    }

    @Override
    @Transactional
    public BookingResponseDTO acceptBookingByDriver(ObjectId bookingId, String driverEmail) {
        var user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        Ride ride = rideRepository.findById(booking.getRideId())
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        if (!ride.getDriverProfileId().equals(driverProfile.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Only the ride driver can accept bookings");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be accepted");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        BookingResponseDTO result = bookingMapper.toResponseDTO(bookingRepository.save(booking));

        // Notify the passenger their booking was confirmed
        passengerProfileRepository.findById(booking.getPassengerProfileId()).ifPresent(pp ->
                userRepository.findById(pp.getUserId()).ifPresent(passengerUser ->
                        notificationService.sendNotification(
                                passengerUser,
                                "Booking Confirmed ✅",
                                "Your booking for the ride from " + ride.getDepartureLocation()
                                        + " to " + ride.getDestinationLocation() + " has been confirmed by the driver.",
                                NotificationType.RIDE_UPDATE,
                                booking.getId().toHexString()
                        )
                )
        );

        return result;
    }

    @Override
    @Transactional
    public BookingResponseDTO rejectBookingByDriver(ObjectId bookingId, String driverEmail) {
        var user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        Ride ride = rideRepository.findById(booking.getRideId())
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        if (!ride.getDriverProfileId().equals(driverProfile.getId())) {
            throw new org.springframework.security.access.AccessDeniedException("Only the ride driver can reject bookings");
        }
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(java.time.LocalDateTime.now());
        bookingRepository.save(booking);

        // Restore seats
        ride.setAvailableSeats(ride.getAvailableSeats() + booking.getNumberOfSeats());
        rideRepository.save(ride);

        ridePaymentRepository.findByBookingId(booking.getId()).ifPresent(payment -> {
            payment.setStatus(esprit_market.Enum.carpoolingEnum.PaymentStatus.REFUNDED);
            ridePaymentRepository.save(payment);
        });

        // Notify the passenger their booking was rejected
        passengerProfileRepository.findById(booking.getPassengerProfileId()).ifPresent(pp ->
                userRepository.findById(pp.getUserId()).ifPresent(passengerUser ->
                        notificationService.sendNotification(
                                passengerUser,
                                "Booking Declined ❌",
                                "Unfortunately, the driver has declined your booking for the ride from "
                                        + ride.getDepartureLocation() + " to " + ride.getDestinationLocation()
                                        + ". You can search for another ride.",
                                NotificationType.RIDE_UPDATE,
                                booking.getId().toHexString()
                        )
                )
        );

        return bookingMapper.toResponseDTO(booking);
    }

}
