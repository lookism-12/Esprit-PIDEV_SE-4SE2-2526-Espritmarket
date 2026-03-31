package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.VehicleRequestDTO;
import esprit_market.dto.carpooling.VehicleResponseDTO;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.Vehicle;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.VehicleMapper;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.repository.carpoolingRepository.VehicleRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock VehicleRepository vehicleRepository;
    @Mock DriverProfileRepository driverProfileRepository;
    @Mock UserRepository userRepository;
    @Mock RideRepository rideRepository;
    @Mock VehicleMapper vehicleMapper;
    @Mock NotificationService notificationService;

    @InjectMocks VehicleService vehicleService;

    private ObjectId userId, driverProfileId, vehicleId;
    private User user;
    private DriverProfile driverProfile;
    private Vehicle vehicle;
    private VehicleResponseDTO vehicleResponseDTO;

    @BeforeEach
    void setUp() {
        userId          = new ObjectId();
        driverProfileId = new ObjectId();
        vehicleId       = new ObjectId();

        user = User.builder().id(userId).email("driver@test.com").build();

        driverProfile = DriverProfile.builder()
                .id(driverProfileId).userId(userId)
                .vehicleIds(new ArrayList<>()).build();

        vehicle = Vehicle.builder()
                .id(vehicleId).driverProfileId(driverProfileId)
                .make("Toyota").model("Corolla")
                .licensePlate("TUN-123").numberOfSeats(5).build();

        vehicleResponseDTO = VehicleResponseDTO.builder()
                .id(vehicleId.toHexString())
                .make("Toyota").model("Corolla")
                .licensePlate("TUN-123").numberOfSeats(5).build();
    }

    // ── createVehicle ─────────────────────────────────────────────────────

    @Test
    @DisplayName("createVehicle: success — saves vehicle and tracks on driver profile")
    void createVehicle_success() {
        VehicleRequestDTO dto = VehicleRequestDTO.builder()
                .make("Toyota").model("Corolla")
                .licensePlate("TUN-123").numberOfSeats(5).build();

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.of(driverProfile));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleMapper.toResponseDTO(vehicle)).thenReturn(vehicleResponseDTO);
        doNothing().when(notificationService).notifyAllAdmins(anyString(), anyString(), any(), anyString());

        VehicleResponseDTO result = vehicleService.createVehicle(dto, "driver@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getMake()).isEqualTo("Toyota");
        verify(driverProfileRepository).save(argThat(dp -> dp.getVehicleIds().contains(vehicleId)));
    }

    @Test
    @DisplayName("createVehicle: throws when driver profile not found")
    void createVehicle_noDriverProfile() {
        VehicleRequestDTO dto = VehicleRequestDTO.builder()
                .make("Toyota").model("Corolla").licensePlate("TUN-123").numberOfSeats(5).build();

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vehicleService.createVehicle(dto, "driver@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Driver profile not found");
    }

    @Test
    @DisplayName("createVehicle: throws when user not found")
    void createVehicle_userNotFound() {
        VehicleRequestDTO dto = VehicleRequestDTO.builder()
                .make("Toyota").model("Corolla").licensePlate("TUN-123").numberOfSeats(5).build();

        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> vehicleService.createVehicle(dto, "nobody@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }

    // ── getMyVehicles ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getMyVehicles: returns vehicles for authenticated driver")
    void getMyVehicles_success() {
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.of(driverProfile));
        when(vehicleRepository.findByDriverProfileId(driverProfileId)).thenReturn(List.of(vehicle));
        when(vehicleMapper.toResponseDTO(vehicle)).thenReturn(vehicleResponseDTO);

        List<VehicleResponseDTO> result = vehicleService.getMyVehicles("driver@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getMake()).isEqualTo("Toyota");
    }

    @Test
    @DisplayName("getMyVehicles: returns empty list when driver has no vehicles")
    void getMyVehicles_empty() {
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.of(driverProfile));
        when(vehicleRepository.findByDriverProfileId(driverProfileId)).thenReturn(List.of());

        List<VehicleResponseDTO> result = vehicleService.getMyVehicles("driver@test.com");

        assertThat(result).isEmpty();
    }

    // ── deleteVehicle ─────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteVehicle: success — removes vehicle and updates driver profile")
    void deleteVehicle_success() {
        driverProfile.getVehicleIds().add(vehicleId);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.of(driverProfile));
        when(rideRepository.findByVehicleId(vehicleId)).thenReturn(List.of());

        vehicleService.deleteVehicle(vehicleId.toHexString(), "driver@test.com");

        verify(vehicleRepository).deleteById(vehicleId);
        verify(driverProfileRepository).save(argThat(dp -> !dp.getVehicleIds().contains(vehicleId)));
    }

    @Test
    @DisplayName("deleteVehicle: throws when vehicle belongs to another driver")
    void deleteVehicle_notOwner() {
        vehicle.setDriverProfileId(new ObjectId()); // different driver

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.of(driverProfile));

        assertThatThrownBy(() -> vehicleService.deleteVehicle(vehicleId.toHexString(), "driver@test.com"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    // ── updateVehicle ─────────────────────────────────────────────────────

    @Test
    @DisplayName("updateVehicle: updates fields and saves")
    void updateVehicle_success() {
        VehicleRequestDTO dto = VehicleRequestDTO.builder()
                .make("Honda").model("Civic").licensePlate("TUN-999").numberOfSeats(4).build();

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.of(driverProfile));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(vehicle);
        when(vehicleMapper.toResponseDTO(vehicle)).thenReturn(vehicleResponseDTO);

        vehicleService.updateVehicle(vehicleId.toHexString(), dto, "driver@test.com");

        verify(vehicleRepository).save(argThat(v -> "Honda".equals(v.getMake())));
    }

    // ── findByDriverProfileId ─────────────────────────────────────────────

    @Test
    @DisplayName("findByDriverProfileId: returns mapped DTOs")
    void findByDriverProfileId_success() {
        when(vehicleRepository.findByDriverProfileId(driverProfileId)).thenReturn(List.of(vehicle));
        when(vehicleMapper.toResponseDTO(vehicle)).thenReturn(vehicleResponseDTO);

        List<VehicleResponseDTO> result = vehicleService.findByDriverProfileId(driverProfileId);

        assertThat(result).hasSize(1);
    }
}
