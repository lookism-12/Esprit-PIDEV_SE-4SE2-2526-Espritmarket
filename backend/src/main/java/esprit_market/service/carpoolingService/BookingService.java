package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.userEnum.Role;
import esprit_market.dto.carpooling.BookingRequestDTO;
import esprit_market.dto.carpooling.BookingResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
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
import esprit_market.service.carpoolingService.PassengerEngagementService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService implements IBookingService {

    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final RidePaymentRepository ridePaymentRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;
    private final PassengerEngagementService engagementService;

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
        return bookingMapper.toResponseDTO(bookingRepository.save(booking));
    }

    /**
     * Driver accepts a PENDING booking → CONFIRMED.
     * Verifies the caller owns the ride the booking belongs to.
     */
    @Override
    @Transactional
    public BookingResponseDTO acceptBooking(ObjectId bookingId, String driverEmail) {
        var driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfileOpt = driverProfileRepository.findByUserId(driver.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be accepted");
        }

        Ride ride = rideRepository.findById(booking.getRideId())
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        if (!ride.getDriverProfileId().equals(driverProfileOpt.getId())) {
            throw new AccessDeniedException("Only the ride driver can accept bookings");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        Booking saved = bookingRepository.save(booking);

        // Mark payment as completed (driver confirmed the ride)
        ridePaymentRepository.findByBookingId(saved.getId()).ifPresent(payment -> {
            payment.setStatus(esprit_market.Enum.carpoolingEnum.PaymentStatus.COMPLETED);
            ridePaymentRepository.save(payment);
        });

        return bookingMapper.toResponseDTO(saved);
    }

    /**
     * Driver rejects a PENDING booking → CANCELLED.
     * Restores the seats on the ride.
     */
    @Override
    @Transactional
    public BookingResponseDTO rejectBooking(ObjectId bookingId, String driverEmail) {
        var driver = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfileOpt = driverProfileRepository.findByUserId(driver.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected");
        }

        Ride ride = rideRepository.findById(booking.getRideId())
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        if (!ride.getDriverProfileId().equals(driverProfileOpt.getId())) {
            throw new AccessDeniedException("Only the ride driver can reject bookings");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(java.time.LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        // Restore seats
        ride.setAvailableSeats(ride.getAvailableSeats() + booking.getNumberOfSeats());
        rideRepository.save(ride);

        // Refund payment
        ridePaymentRepository.findByBookingId(saved.getId()).ifPresent(payment -> {
            payment.setStatus(esprit_market.Enum.carpoolingEnum.PaymentStatus.REFUNDED);
            ridePaymentRepository.save(payment);
        });

        return bookingMapper.toResponseDTO(saved);
    }

    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO dto, String passengerEmail, ObjectId rideId) {
        var user = userRepository.findByEmail(passengerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var passengerProfile = passengerProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> createPassengerProfile(user));
        ObjectId passengerProfileId = passengerProfile.getId();

        Ride ride = rideRepository.findById(rideId).orElseThrow(() -> new IllegalArgumentException("Ride not found"));

        if (ride.getStatus() != esprit_market.Enum.carpoolingEnum.RideStatus.CONFIRMED) {
            throw new IllegalStateException("Ride is not available for booking");
        }

        // Logic improvement: Prevent self-booking
        if (ride.getDriverProfileId().equals(passengerProfileId)) {
            throw new IllegalStateException("Drivers cannot book their own rides");
        }
        if (dto.getNumberOfSeats() > ride.getAvailableSeats()) {
            throw new IllegalStateException("Not enough available seats. Requested: " + dto.getNumberOfSeats()
                    + ", Available: " + ride.getAvailableSeats());
        }

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

        // Award engagement points for booking
        engagementService.awardBookingPoints(passengerProfileId);

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

    private PassengerProfile createPassengerProfile(User user) {
        PassengerProfile profile = PassengerProfile.builder()
                .userId(user.getId())
                .averageRating(0f)
                .preferences("")
                .build();
        profile = passengerProfileRepository.save(profile);
        user.setPassengerProfileId(profile.getId());
        if (user.getRoles() == null) {
            user.setRoles(new java.util.ArrayList<>());
        }
        if (!user.getRoles().contains(Role.PASSENGER)) {
            user.getRoles().add(Role.PASSENGER);
        }
        userRepository.save(user);
        return profile;
    }

    @Override
    public java.util.Map<String, Double> getMonthlyDemandTrend() {
        return bookingRepository.getMonthlyDemandTrend().stream()
                .collect(java.util.stream.Collectors.toMap(
                        esprit_market.dto.carpooling.stats.AggregationAmountResult::getId,
                        esprit_market.dto.carpooling.stats.AggregationAmountResult::getAmount,
                        (v1, v2) -> v1,
                        java.util.TreeMap::new
                ));
    }
}
