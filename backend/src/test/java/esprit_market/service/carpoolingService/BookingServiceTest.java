package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.dto.carpooling.BookingRequestDTO;
import esprit_market.dto.carpooling.BookingResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.BookingMapper;
import esprit_market.repository.carpoolingRepository.*;
import esprit_market.repository.userRepository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock BookingRepository bookingRepository;
    @Mock RideRepository rideRepository;
    @Mock RidePaymentRepository ridePaymentRepository;
    @Mock PassengerProfileRepository passengerProfileRepository;
    @Mock UserRepository userRepository;
    @Mock BookingMapper bookingMapper;
    @Mock esprit_market.repository.carpoolingRepository.DriverProfileRepository driverProfileRepository;
    @Mock esprit_market.service.notificationService.NotificationService notificationService;

    @InjectMocks BookingService bookingService;

    private ObjectId userId, passengerProfileId, rideId, bookingId;
    private User user;
    private PassengerProfile passengerProfile;
    private Ride ride;
    private Booking booking;
    private BookingResponseDTO bookingResponseDTO;

    @BeforeEach
    void setUp() {
        userId            = new ObjectId();
        passengerProfileId = new ObjectId();
        rideId            = new ObjectId();
        bookingId         = new ObjectId();

        user = User.builder().id(userId).email("passenger@test.com").build();

        passengerProfile = PassengerProfile.builder()
                .id(passengerProfileId).userId(userId)
                .bookingIds(new ArrayList<>()).build();

        ride = Ride.builder()
                .id(rideId)
                .driverProfileId(new ObjectId())
                .availableSeats(3)
                .pricePerSeat(5.0f)
                .status(RideStatus.CONFIRMED)
                .build();

        booking = Booking.builder()
                .id(bookingId)
                .rideId(rideId)
                .passengerProfileId(passengerProfileId)
                .numberOfSeats(1)
                .pickupLocation("A")
                .dropoffLocation("B")
                .status(BookingStatus.PENDING)
                .totalPrice(5.0f)
                .build();

        bookingResponseDTO = BookingResponseDTO.builder()
                .bookingId(bookingId.toHexString())
                .rideId(rideId.toHexString())
                .numberOfSeats(1)
                .status(BookingStatus.PENDING)
                .totalPrice(5.0f)
                .build();
    }

    // ── createBooking ─────────────────────────────────────────────────────

    @Test
    @DisplayName("createBooking: success — creates booking and decrements seats")
    void createBooking_success() {
        BookingRequestDTO dto = BookingRequestDTO.builder()
                .rideId(rideId.toHexString())
                .numberOfSeats(1)
                .pickupLocation("A")
                .dropoffLocation("B")
                .build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(passengerProfile));
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(ride));
        when(bookingRepository.findByRideId(rideId)).thenReturn(new ArrayList<>());  // No existing bookings
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);
        when(passengerProfileRepository.findById(passengerProfileId)).thenReturn(Optional.of(passengerProfile));
        when(ridePaymentRepository.save(any())).thenReturn(null);
        when(bookingMapper.toResponseDTO(booking)).thenReturn(bookingResponseDTO);
        when(driverProfileRepository.findById(any())).thenReturn(Optional.empty());

        BookingResponseDTO result = bookingService.createBooking(dto, "passenger@test.com", rideId);

        assertThat(result).isNotNull();
        assertThat(result.getNumberOfSeats()).isEqualTo(1);
        verify(rideRepository).save(any(Ride.class)); // seats decremented
    }

    @Test
    @DisplayName("createBooking: throws when not enough seats")
    void createBooking_notEnoughSeats() {
        ride.setAvailableSeats(4);  // Reset to max capacity
        BookingRequestDTO dto = BookingRequestDTO.builder()
                .rideId(rideId.toHexString()).numberOfSeats(3)
                .pickupLocation("A").dropoffLocation("B").build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(passengerProfile));
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(ride));
        // Mock that ride already has 2 bookings of 1 seat each = 2 seats taken, 2 available
        Booking existingBooking1 = Booking.builder().numberOfSeats(1).status(BookingStatus.CONFIRMED).build();
        Booking existingBooking2 = Booking.builder().numberOfSeats(1).status(BookingStatus.CONFIRMED).build();
        when(bookingRepository.findByRideId(rideId)).thenReturn(List.of(existingBooking1, existingBooking2));

        assertThatThrownBy(() -> bookingService.createBooking(dto, "passenger@test.com", rideId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Not enough available seats");
    }

    @Test
    @DisplayName("createBooking: throws when ride is not in CONFIRMED status")
    void createBooking_rideNotAvailable() {
        ride.setStatus(RideStatus.CANCELLED);
        BookingRequestDTO dto = BookingRequestDTO.builder()
                .rideId(rideId.toHexString()).numberOfSeats(1)
                .pickupLocation("A").dropoffLocation("B").build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(passengerProfile));
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(ride));

        assertThatThrownBy(() -> bookingService.createBooking(dto, "passenger@test.com", rideId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not available for booking");
    }

    @Test
    @DisplayName("createBooking: throws when passenger profile not found")
    void createBooking_noPassengerProfile() {
        BookingRequestDTO dto = BookingRequestDTO.builder()
                .rideId(rideId.toHexString()).numberOfSeats(1)
                .pickupLocation("A").dropoffLocation("B").build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.createBooking(dto, "passenger@test.com", rideId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Passenger profile not found");
    }

    // ── cancelBooking ─────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelBooking: success — sets status to CANCELLED and restores seats")
    void cancelBooking_success() {
        booking.setStatus(BookingStatus.CONFIRMED);

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(passengerProfile));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(ride));
        when(ridePaymentRepository.findByBookingId(bookingId)).thenReturn(Optional.empty());

        bookingService.cancelBooking(bookingId.toHexString(), "passenger@test.com");

        verify(bookingRepository).save(argThat(b -> b.getStatus() == BookingStatus.CANCELLED));
        verify(rideRepository).save(argThat(r -> r.getAvailableSeats() == 4)); // 3 + 1
    }

    @Test
    @DisplayName("cancelBooking: throws when booking is already cancelled")
    void cancelBooking_alreadyCancelled() {
        booking.setStatus(BookingStatus.CANCELLED);

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(passengerProfile));
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelBooking(bookingId.toHexString(), "passenger@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot be cancelled");
    }

    // ── findMyBookings ────────────────────────────────────────────────────

    @Test
    @DisplayName("findMyBookings: returns bookings for authenticated passenger")
    void findMyBookings_success() {
        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(passengerProfile));
        when(bookingRepository.findByPassengerProfileId(passengerProfileId)).thenReturn(List.of(booking));
        when(bookingMapper.toResponseDTO(booking)).thenReturn(bookingResponseDTO);

        List<BookingResponseDTO> result = bookingService.findMyBookings("passenger@test.com");

        assertThat(result).hasSize(1);
    }
}
