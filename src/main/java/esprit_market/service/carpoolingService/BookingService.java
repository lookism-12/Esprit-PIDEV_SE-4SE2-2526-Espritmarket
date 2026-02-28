package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.dto.carpooling.BookingRequestDTO;
import esprit_market.dto.carpooling.BookingResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.carpooling.RidePayment;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RidePaymentRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
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

    @Override
    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }

    @Override
    public Booking save(Booking booking) {
        return bookingRepository.save(booking);
    }

    @Override
    public Booking findById(ObjectId id) {
        return bookingRepository.findById(id).orElse(null);
    }

    @Override
    public void deleteById(ObjectId id) {
        bookingRepository.deleteById(id);
    }

    @Override
    public List<Booking> findByRideId(ObjectId rideId) {
        return bookingRepository.findByRideId(rideId);
    }

    @Override
    public List<Booking> findByPassengerProfileId(ObjectId passengerProfileId) {
        return bookingRepository.findByPassengerProfileId(passengerProfileId);
    }

    @Override
    public List<Booking> findByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    @Override
    public Booking update(ObjectId id, Booking booking, ObjectId passengerProfileId) {
        Booking existing = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!existing.getPassengerProfileId().equals(passengerProfileId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the booking owner can update this booking");
        }

        if (booking.getNumberOfSeats() != null && !booking.getNumberOfSeats().equals(existing.getNumberOfSeats())) {
            Ride ride = rideRepository.findById(existing.getRideId()).orElse(null);
            if (ride != null) {
                int delta = booking.getNumberOfSeats() - existing.getNumberOfSeats();
                if (ride.getAvailableSeats() < delta) {
                    throw new IllegalStateException("Not enough seats available");
                }
                ride.setAvailableSeats(ride.getAvailableSeats() - delta);
                rideRepository.save(ride);
            }
            existing.setNumberOfSeats(booking.getNumberOfSeats());
        }
        if (booking.getPickupLocation() != null) {
            existing.setPickupLocation(booking.getPickupLocation());
        }
        if (booking.getDropoffLocation() != null) {
            existing.setDropoffLocation(booking.getDropoffLocation());
        }
        if (booking.getTotalPrice() != null) {
            existing.setTotalPrice(booking.getTotalPrice());
        }
        return bookingRepository.save(existing);
    }

    @Override
    public Booking updateStatus(ObjectId id, BookingStatus status) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        booking.setStatus(status);

        // Part 2: Logical additions
        if (status == BookingStatus.CONFIRMED) {
            // Send notification to passenger
            // notificationService.notifyUser(booking.getPassengerProfileId(), "Booking
            // Confirmed", "Your booking has been confirmed.");
        }

        return bookingRepository.save(booking);
    }

    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO dto, String passengerEmail, ObjectId passengerProfileId) {
        ObjectId rideId = new ObjectId(dto.getRideId());
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

        return toResponseDTO(savedBooking);
    }

    @Transactional
    public void cancelBooking(String bookingId, String passengerEmail, ObjectId passengerProfileId) {
        Booking booking = bookingRepository.findById(new ObjectId(bookingId))
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getPassengerProfileId().equals(passengerProfileId)) {
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

            // Part 2: Notify driver
            // notificationService.notifyDriver(ride.getDriverProfileId(), "Booking
            // Cancelled", "A passenger has cancelled their booking.");
        }

        ridePaymentRepository.findByBookingId(booking.getId()).ifPresent(payment -> {
            payment.setStatus(esprit_market.Enum.carpoolingEnum.PaymentStatus.REFUNDED);
            ridePaymentRepository.save(payment);
        });
    }

    public BookingResponseDTO toResponseDTO(Booking booking) {
        return BookingResponseDTO.builder()
                .bookingId(booking.getId().toHexString())
                .rideId(booking.getRideId().toHexString())
                .passengerProfileId(booking.getPassengerProfileId().toHexString())
                .numberOfSeats(booking.getNumberOfSeats())
                .pickupLocation(booking.getPickupLocation())
                .dropoffLocation(booking.getDropoffLocation())
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getCreatedAt())
                .cancelledAt(booking.getCancelledAt())
                .build();
    }
}
