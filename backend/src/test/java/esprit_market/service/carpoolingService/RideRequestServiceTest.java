package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.RideRequestStatus;
import esprit_market.dto.carpooling.PassengerRideRequestCreationDTO;
import esprit_market.dto.carpooling.RideRequestResponseDTO;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.carpooling.RideRequest;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.RideRequestMapper;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RideRequestServiceTest {

    @Mock RideRequestRepository rideRequestRepository;
    @Mock PassengerProfileRepository passengerProfileRepository;
    @Mock DriverProfileRepository driverProfileRepository;
    @Mock UserRepository userRepository;
    @Mock RideRepository rideRepository;
    @Mock BookingRepository bookingRepository;
    @Mock RideRequestMapper rideRequestMapper;
    @Mock NotificationService notificationService;

    @InjectMocks RideRequestService rideRequestService;

    private ObjectId passengerId, passengerProfileId, driverUserId, driverProfileId, vehicleId, requestId;
    private User passengerUser, driverUser;
    private PassengerProfile passengerProfile;
    private DriverProfile driverProfile;
    private RideRequest rideRequest;
    private RideRequestResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        passengerId        = new ObjectId();
        passengerProfileId = new ObjectId();
        driverUserId       = new ObjectId();
        driverProfileId    = new ObjectId();
        vehicleId          = new ObjectId();
        requestId          = new ObjectId();

        passengerUser = User.builder().id(passengerId).email("passenger@test.com").build();
        driverUser    = User.builder().id(driverUserId).email("driver@test.com").build();

        passengerProfile = PassengerProfile.builder()
                .id(passengerProfileId).userId(passengerId).build();

        driverProfile = DriverProfile.builder()
                .id(driverProfileId).userId(driverUserId).build();

        rideRequest = RideRequest.builder()
                .id(requestId)
                .passengerProfileId(passengerProfileId)
                .departureLocation("Tunis")
                .destinationLocation("Sousse")
                .departureTime(LocalDateTime.now().plusHours(3))
                .requestedSeats(2)
                .proposedPrice(8.0f)
                .status(RideRequestStatus.PENDING)
                .build();

        responseDTO = RideRequestResponseDTO.builder()
                .id(requestId.toHexString())
                .departureLocation("Tunis")
                .destinationLocation("Sousse")
                .status(RideRequestStatus.PENDING)
                .build();
    }

    // ── createRequest ─────────────────────────────────────────────────────

    @Test
    @DisplayName("createRequest: success — saves request with PENDING status")
    void createRequest_success() {
        PassengerRideRequestCreationDTO dto = new PassengerRideRequestCreationDTO();
        dto.setDepartureLocation("Tunis");
        dto.setDestinationLocation("Sousse");
        dto.setDepartureTime(LocalDateTime.now().plusHours(3));
        dto.setRequestedSeats(2);
        dto.setProposedPrice(8.0f);

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));
        when(passengerProfileRepository.findByUserId(passengerId)).thenReturn(Optional.of(passengerProfile));
        when(rideRequestRepository.save(any(RideRequest.class))).thenReturn(rideRequest);
        when(rideRequestMapper.toResponseDTO(rideRequest)).thenReturn(responseDTO);

        RideRequestResponseDTO result = rideRequestService.createRequest(dto, "passenger@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getDepartureLocation()).isEqualTo("Tunis");
        verify(rideRequestRepository).save(argThat(r -> r.getStatus() == RideRequestStatus.PENDING));
    }

    @Test
    @DisplayName("createRequest: throws when passenger profile not found")
    void createRequest_noProfile() {
        PassengerRideRequestCreationDTO dto = new PassengerRideRequestCreationDTO();
        dto.setDepartureLocation("Tunis"); dto.setDestinationLocation("Sousse");
        dto.setDepartureTime(LocalDateTime.now().plusHours(1));
        dto.setRequestedSeats(1);

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));
        when(passengerProfileRepository.findByUserId(passengerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rideRequestService.createRequest(dto, "passenger@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Passenger profile not found");
    }

    // ── acceptRequest ─────────────────────────────────────────────────────

    @Test
    @DisplayName("acceptRequest: success — creates ride, booking, marks request ACCEPTED, sends notification")
    void acceptRequest_success() {
        Ride savedRide = Ride.builder().id(new ObjectId()).driverProfileId(driverProfileId)
                .vehicleId(vehicleId).departureLocation("Tunis").destinationLocation("Sousse")
                .availableSeats(2).pricePerSeat(8.0f).build();

        RideRequestResponseDTO acceptedDTO = RideRequestResponseDTO.builder()
                .id(requestId.toHexString()).status(RideRequestStatus.ACCEPTED).build();

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driverUser));
        when(driverProfileRepository.findByUserId(driverUserId)).thenReturn(Optional.of(driverProfile));
        when(rideRequestRepository.findById(requestId)).thenReturn(Optional.of(rideRequest));
        when(rideRepository.save(any(Ride.class))).thenReturn(savedRide);
        when(bookingRepository.save(any())).thenReturn(null);
        when(rideRequestRepository.save(any(RideRequest.class))).thenReturn(rideRequest);
        when(passengerProfileRepository.findById(passengerProfileId)).thenReturn(Optional.of(passengerProfile));
        when(userRepository.findById(passengerId)).thenReturn(Optional.of(passengerUser));
        when(rideRequestMapper.toResponseDTO(rideRequest)).thenReturn(acceptedDTO);

        RideRequestResponseDTO result = rideRequestService.acceptRequest(
                requestId.toHexString(), "driver@test.com", vehicleId.toHexString());

        assertThat(result.getStatus()).isEqualTo(RideRequestStatus.ACCEPTED);
        verify(rideRepository).save(any(Ride.class));
        verify(bookingRepository).save(any());
        verify(notificationService).sendNotification(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("acceptRequest: throws when request is not PENDING")
    void acceptRequest_notPending() {
        rideRequest.setStatus(RideRequestStatus.ACCEPTED);

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(driverUser));
        when(driverProfileRepository.findByUserId(driverUserId)).thenReturn(Optional.of(driverProfile));
        when(rideRequestRepository.findById(requestId)).thenReturn(Optional.of(rideRequest));

        assertThatThrownBy(() -> rideRequestService.acceptRequest(
                requestId.toHexString(), "driver@test.com", vehicleId.toHexString()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("no longer available");
    }

    // ── cancelRequest ─────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelRequest: success — sets status to CANCELLED")
    void cancelRequest_success() {
        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));
        when(passengerProfileRepository.findByUserId(passengerId)).thenReturn(Optional.of(passengerProfile));
        when(rideRequestRepository.findById(requestId)).thenReturn(Optional.of(rideRequest));

        rideRequestService.cancelRequest(requestId.toHexString(), "passenger@test.com");

        verify(rideRequestRepository).save(argThat(r -> r.getStatus() == RideRequestStatus.CANCELLED));
    }

    @Test
    @DisplayName("cancelRequest: throws when another passenger tries to cancel")
    void cancelRequest_notOwner() {
        ObjectId otherId = new ObjectId();
        PassengerProfile otherProfile = PassengerProfile.builder().id(otherId).userId(new ObjectId()).build();
        User otherUser = User.builder().id(new ObjectId()).email("other@test.com").build();

        when(userRepository.findByEmail("other@test.com")).thenReturn(Optional.of(otherUser));
        when(passengerProfileRepository.findByUserId(otherUser.getId())).thenReturn(Optional.of(otherProfile));
        when(rideRequestRepository.findById(requestId)).thenReturn(Optional.of(rideRequest));

        assertThatThrownBy(() -> rideRequestService.cancelRequest(requestId.toHexString(), "other@test.com"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    // ── getAvailableRequests ──────────────────────────────────────────────

    @Test
    @DisplayName("getAvailableRequests: returns only PENDING future requests")
    void getAvailableRequests_returnsPending() {
        when(rideRequestRepository.findByStatusAndDepartureTimeAfter(
                eq(RideRequestStatus.PENDING), any(LocalDateTime.class)))
                .thenReturn(List.of(rideRequest));
        when(rideRequestMapper.toResponseDTO(rideRequest)).thenReturn(responseDTO);

        List<RideRequestResponseDTO> result = rideRequestService.getAvailableRequests();

        assertThat(result).hasSize(1);
    }

    // ── counterPrice ──────────────────────────────────────────────────────

    @Test
    @DisplayName("counterPrice: updates counter price and note on request")
    void counterPrice_success() {
        RideRequestResponseDTO counterDTO = RideRequestResponseDTO.builder()
                .id(requestId.toHexString()).counterPrice(10.0f).counterPriceNote("Final offer").build();

        when(rideRequestRepository.findById(requestId)).thenReturn(Optional.of(rideRequest));
        when(rideRequestRepository.save(any(RideRequest.class))).thenReturn(rideRequest);
        when(rideRequestMapper.toResponseDTO(rideRequest)).thenReturn(counterDTO);

        RideRequestResponseDTO result = rideRequestService.counterPrice(
                requestId.toHexString(), 10.0f, "Final offer");

        assertThat(result.getCounterPrice()).isEqualTo(10.0f);
        verify(rideRequestRepository).save(argThat(r -> r.getCounterPrice() == 10.0f));
    }
}
