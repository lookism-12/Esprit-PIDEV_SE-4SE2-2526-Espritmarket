package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.dto.carpooling.RideRequestDTO;
import esprit_market.dto.carpooling.RideResponseDTO;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.RideMapper;
import esprit_market.repository.carpoolingRepository.*;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationService;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RideServiceTest {

    @Mock RideRepository rideRepository;
    @Mock VehicleRepository vehicleRepository;
    @Mock DriverProfileRepository driverProfileRepository;
    @Mock BookingRepository bookingRepository;
    @Mock RidePaymentRepository ridePaymentRepository;
    @Mock PassengerProfileRepository passengerProfileRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationService notificationService;
    @Mock IPassengerProfileService passengerProfileService;
    @Mock IDriverProfileService driverProfileService;
    @Mock RatingService ratingService;
    @Mock RideMapper rideMapper;

    @InjectMocks RideService rideService;

    private ObjectId driverUserId;
    private ObjectId driverProfileId;
    private ObjectId vehicleId;
    private ObjectId rideId;
    private User driverUser;
    private DriverProfile driverProfile;
    private Ride ride;
    private RideResponseDTO rideResponseDTO;

    @BeforeEach
    void setUp() {
        driverUserId   = new ObjectId();
        driverProfileId = new ObjectId();
        vehicleId      = new ObjectId();
        rideId         = new ObjectId();

        driverUser = User.builder()
                .id(driverUserId)
                .email("driver@test.com")
                .firstName("John")
                .lastName("Driver")
                .build();

        driverProfile = DriverProfile.builder()
                .id(driverProfileId)
                .userId(driverUserId)
                .isVerified(true)
                .rideIds(new ArrayList<>())
                .build();

        ride = Ride.builder()
                .id(rideId)
                .driverProfileId(driverProfileId)
                .vehicleId(vehicleId)
                .departureLocation("Tunis")
                .destinationLocation("Sfax")
                .departureTime(LocalDateTime.now().plusHours(2))
                .availableSeats(3)
                .pricePerSeat(5.0f)
                .status(RideStatus.ACCEPTED)
                .build();

        rideResponseDTO = RideResponseDTO.builder()
                .rideId(rideId.toHexString())
                .departureLocation("Tunis")
                .destinationLocation("Sfax")
                .availableSeats(3)
                .pricePerSeat(5.0f)
                .status(RideStatus.ACCEPTED)
                .build();
    }

    // ── createRide ────────────────────────────────────────────────────────

    @Test
    @DisplayName("createRide: success when driver is verified and vehicle belongs to driver")
    void createRide_success() {
        RideRequestDTO dto = RideRequestDTO.builder()
                .vehicleId(vehicleId.toHexString())
                .departureLocation("Tunis")
                .destinationLocation("Sfax")
                .departureTime(LocalDateTime.now().plusHours(2))
                .availableSeats(3)
                .pricePerSeat(5.0f)
                .estimatedDurationMinutes(90)
                .build();

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driverUser));
        when(driverProfileRepository.findByUserId(driverUserId)).thenReturn(Optional.of(driverProfile));
        when(vehicleRepository.existsByIdAndDriverProfileId(vehicleId, driverProfileId)).thenReturn(true);
        when(rideRepository.save(any(Ride.class))).thenReturn(ride);
        when(rideMapper.toResponseDTO(ride)).thenReturn(rideResponseDTO);

        RideResponseDTO result = rideService.createRide(dto, "driver@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getDepartureLocation()).isEqualTo("Tunis");
        verify(rideRepository).save(any(Ride.class));
    }

    @Test
    @DisplayName("createRide: throws when driver profile not found")
    void createRide_noDriverProfile() {
        RideRequestDTO dto = RideRequestDTO.builder()
                .vehicleId(vehicleId.toHexString())
                .departureLocation("Tunis").destinationLocation("Sfax")
                .departureTime(LocalDateTime.now().plusHours(1))
                .availableSeats(2).pricePerSeat(4f).estimatedDurationMinutes(60)
                .build();

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driverUser));
        when(driverProfileRepository.findByUserId(driverUserId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rideService.createRide(dto, "driver@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Driver profile not found");
    }

    @Test
    @DisplayName("createRide: throws when driver is not verified")
    void createRide_notVerified() {
        driverProfile.setIsVerified(false);
        RideRequestDTO dto = RideRequestDTO.builder()
                .vehicleId(vehicleId.toHexString())
                .departureLocation("Tunis").destinationLocation("Sfax")
                .departureTime(LocalDateTime.now().plusHours(1))
                .availableSeats(2).pricePerSeat(4f).estimatedDurationMinutes(60)
                .build();

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driverUser));
        when(driverProfileRepository.findByUserId(driverUserId)).thenReturn(Optional.of(driverProfile));

        assertThatThrownBy(() -> rideService.createRide(dto, "driver@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not verified");
    }

    // ── getMyRides ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getMyRides: returns rides for authenticated driver")
    void getMyRides_success() {
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driverUser));
        when(driverProfileRepository.findByUserId(driverUserId)).thenReturn(Optional.of(driverProfile));
        when(rideRepository.findByDriverProfileId(driverProfileId)).thenReturn(List.of(ride));
        when(rideMapper.toResponseDTO(ride)).thenReturn(rideResponseDTO);

        List<RideResponseDTO> result = rideService.getMyRides("driver@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDepartureLocation()).isEqualTo("Tunis");
    }

    @Test
    @DisplayName("getMyRides: throws when user not found")
    void getMyRides_userNotFound() {
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rideService.getMyRides("nobody@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }

    // ── searchRides ───────────────────────────────────────────────────────

    @Test
    @DisplayName("searchRides: filters by departure and destination (case-insensitive)")
    void searchRides_filtersByLocation() {
        when(rideRepository.findAll()).thenReturn(List.of(ride));
        when(rideMapper.toResponseDTO(ride)).thenReturn(rideResponseDTO);

        List<RideResponseDTO> result = rideService.searchRides("tunis", "sfax", null, null);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("searchRides: returns empty when no match")
    void searchRides_noMatch() {
        when(rideRepository.findAll()).thenReturn(List.of(ride));

        List<RideResponseDTO> result = rideService.searchRides("Bizerte", "Sfax", null, null);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("searchRides: filters out rides with insufficient seats")
    void searchRides_notEnoughSeats() {
        when(rideRepository.findAll()).thenReturn(List.of(ride)); // ride has 3 seats

        List<RideResponseDTO> result = rideService.searchRides(null, null, null, 5);

        assertThat(result).isEmpty();
    }

    // ── updateStatus ──────────────────────────────────────────────────────

    @Test
    @DisplayName("updateStatus: throws when ride is already in terminal state")
    void updateStatus_terminalState() {
        ride.setStatus(RideStatus.COMPLETED);
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(ride));

        assertThatThrownBy(() -> rideService.updateStatus(rideId, RideStatus.ON_ROUTE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("terminal state");
    }

    // ── findAll ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll: returns mapped DTOs for all rides")
    void findAll_returnsMappedList() {
        when(rideRepository.findAll()).thenReturn(List.of(ride));
        when(rideMapper.toResponseDTO(ride)).thenReturn(rideResponseDTO);

        List<RideResponseDTO> result = rideService.findAll();

        assertThat(result).hasSize(1);
        verify(rideMapper).toResponseDTO(ride);
    }
}
