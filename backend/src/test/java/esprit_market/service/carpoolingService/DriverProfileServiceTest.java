package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.RideRequestStatus;
import esprit_market.Enum.userEnum.Role;
import esprit_market.dto.carpooling.DriverProfileRequestDTO;
import esprit_market.dto.carpooling.DriverProfileResponseDTO;
import esprit_market.dto.carpooling.DriverStatsDTO;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.DriverProfileMapper;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.RidePaymentRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.repository.carpoolingRepository.RideRequestRepository;
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
class DriverProfileServiceTest {

    @Mock DriverProfileRepository driverProfileRepository;
    @Mock RideRepository rideRepository;
    @Mock BookingRepository bookingRepository;
    @Mock RidePaymentRepository ridePaymentRepository;
    @Mock RideRequestRepository rideRequestRepository;
    @Mock UserRepository userRepository;
    @Mock DriverProfileMapper driverProfileMapper;
    @Mock IRideService rideService;
    @Mock esprit_market.service.notificationService.NotificationService notificationService;

    @InjectMocks DriverProfileService driverProfileService;

    private ObjectId userId;
    private ObjectId profileId;
    private User user;
    private DriverProfile profile;
    private DriverProfileResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        userId    = new ObjectId();
        profileId = new ObjectId();

        user = User.builder()
                .id(userId)
                .email("driver@test.com")
                .firstName("John")
                .lastName("Driver")
                .roles(new ArrayList<>(List.of(Role.CLIENT)))
                .build();

        profile = DriverProfile.builder()
                .id(profileId)
                .userId(userId)
                .licenseNumber("LIC123")
                .licenseDocument("doc.pdf")
                .isVerified(false)
                .averageRating(0f)
                .totalRidesCompleted(0)
                .totalEarnings(0f)
                .build();

        // DriverProfileResponseDTO uses fullName (not driverName)
        responseDTO = DriverProfileResponseDTO.builder()
                .id(profileId.toHexString())
                .userId(userId.toHexString())
                .fullName("John Driver")
                .isVerified(false)
                .averageRating(0f)
                .totalRidesCompleted(0)
                .totalEarnings(0f)
                .build();
    }

    // ── registerDriver ────────────────────────────────────────────────────

    @Test
    @DisplayName("registerDriver: success — creates profile and adds DRIVER role")
    void registerDriver_success() {
        DriverProfileRequestDTO dto = DriverProfileRequestDTO.builder()
                .licenseNumber("LIC123")
                .licenseDocument("doc.pdf")
                .build();

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.existsByUserId(userId)).thenReturn(false);
        when(driverProfileRepository.save(any(DriverProfile.class))).thenReturn(profile);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(driverProfileMapper.toResponseDTO(profile)).thenReturn(responseDTO);

        DriverProfileResponseDTO result = driverProfileService.registerDriver(dto, "driver@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(profileId.toHexString());
        verify(userRepository).save(argThat(u -> u.getRoles().contains(Role.DRIVER)));
    }

    @Test
    @DisplayName("registerDriver: throws when profile already exists")
    void registerDriver_alreadyExists() {
        DriverProfileRequestDTO dto = DriverProfileRequestDTO.builder()
                .licenseNumber("LIC123").licenseDocument("doc.pdf").build();

        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.existsByUserId(userId)).thenReturn(true);

        assertThatThrownBy(() -> driverProfileService.registerDriver(dto, "driver@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("registerDriver: throws when user not found")
    void registerDriver_userNotFound() {
        DriverProfileRequestDTO dto = DriverProfileRequestDTO.builder()
                .licenseNumber("LIC123").licenseDocument("doc.pdf").build();

        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driverProfileService.registerDriver(dto, "nobody@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }

    // ── verifyDriver ──────────────────────────────────────────────────────

    @Test
    @DisplayName("verifyDriver: sets isVerified to true and saves")
    void verifyDriver_success() {
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        driverProfileService.verifyDriver(profileId);

        verify(driverProfileRepository).save(argThat(p -> Boolean.TRUE.equals(p.getIsVerified())));
    }

    @Test
    @DisplayName("verifyDriver: throws when profile not found")
    void verifyDriver_notFound() {
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driverProfileService.verifyDriver(profileId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Driver profile not found");
    }

    // ── incrementTotalRidesAndEarnings ────────────────────────────────────

    @Test
    @DisplayName("incrementTotalRidesAndEarnings: increments rides count and adds earnings")
    void incrementTotalRidesAndEarnings_success() {
        profile.setTotalRidesCompleted(2);
        profile.setTotalEarnings(20f);
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        driverProfileService.incrementTotalRidesAndEarnings(profileId, 10f);

        verify(driverProfileRepository).save(argThat(p ->
                p.getTotalRidesCompleted() == 3 && p.getTotalEarnings() == 30f));
    }

    @Test
    @DisplayName("incrementTotalRidesAndEarnings: initialises from null values")
    void incrementTotalRidesAndEarnings_fromNull() {
        profile.setTotalRidesCompleted(null);
        profile.setTotalEarnings(null);
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        driverProfileService.incrementTotalRidesAndEarnings(profileId, 5f);

        verify(driverProfileRepository).save(argThat(p ->
                p.getTotalRidesCompleted() == 1 && p.getTotalEarnings() == 5f));
    }

    @Test
    @DisplayName("incrementTotalRidesAndEarnings: does nothing when profile not found")
    void incrementTotalRidesAndEarnings_notFound() {
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.empty());

        driverProfileService.incrementTotalRidesAndEarnings(profileId, 10f);

        verify(driverProfileRepository, never()).save(any());
    }

    // ── getMyProfile ──────────────────────────────────────────────────────

    @Test
    @DisplayName("getMyProfile: returns DTO for authenticated driver")
    void getMyProfile_success() {
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(driverProfileMapper.toResponseDTO(profile)).thenReturn(responseDTO);

        DriverProfileResponseDTO result = driverProfileService.getMyProfile("driver@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(profileId.toHexString());
        assertThat(result.getFullName()).isEqualTo("John Driver");
    }

    @Test
    @DisplayName("getMyProfile: returns null when no profile exists")
    void getMyProfile_noProfile() {
        when(userRepository.findByEmail("driver@test.com")).thenReturn(Optional.of(user));
        when(driverProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(driverProfileMapper.toResponseDTO(null)).thenReturn(null);

        DriverProfileResponseDTO result = driverProfileService.getMyProfile("driver@test.com");

        assertThat(result).isNull();
    }

    // ── getDriverStats ────────────────────────────────────────────────────

    @Test
    @DisplayName("getDriverStats: returns zero stats when driver has no completed rides")
    void getDriverStats_noRides() {
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
        when(rideRepository.findByDriverProfileId(profileId)).thenReturn(List.of());
        when(rideRequestRepository.countByStatus(RideRequestStatus.PENDING)).thenReturn(3L);

        DriverStatsDTO stats = driverProfileService.getDriverStats(profileId);

        assertThat(stats.getTotalRidesCompleted()).isEqualTo(0);
        assertThat(stats.getTotalEarnings()).isEqualTo(0f);
        assertThat(stats.getDirectRequestsCount()).isEqualTo(3L);
        assertThat(stats.getAverageRating()).isEqualTo(0f);
    }

    @Test
    @DisplayName("getDriverStats: throws when profile not found")
    void getDriverStats_notFound() {
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driverProfileService.getDriverStats(profileId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Driver profile not found");
    }

    // ── update ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update: updates license number and document")
    void update_success() {
        DriverProfile updated = DriverProfile.builder()
                .id(profileId)
                .licenseNumber("NEW123")
                .licenseDocument("new.pdf")
                .build();
        DriverProfileResponseDTO updatedDTO = DriverProfileResponseDTO.builder()
                .id(profileId.toHexString())
                .licenseNumber("NEW123")
                .build();

        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
        when(driverProfileRepository.save(any(DriverProfile.class))).thenReturn(updated);
        when(driverProfileMapper.toResponseDTO(updated)).thenReturn(updatedDTO);

        DriverProfile patch = new DriverProfile();
        patch.setLicenseNumber("NEW123");
        patch.setLicenseDocument("new.pdf");

        DriverProfileResponseDTO result = driverProfileService.update(profileId, patch);

        assertThat(result).isNotNull();
        verify(driverProfileRepository).save(argThat(p ->
                "NEW123".equals(p.getLicenseNumber()) && "new.pdf".equals(p.getLicenseDocument())));
    }

    @Test
    @DisplayName("update: throws when profile not found")
    void update_notFound() {
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> driverProfileService.update(profileId, new DriverProfile()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Driver profile not found");
    }

    // ── findById ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById: returns mapped DTO")
    void findById_success() {
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
        when(driverProfileMapper.toResponseDTO(profile)).thenReturn(responseDTO);

        DriverProfileResponseDTO result = driverProfileService.findById(profileId);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(profileId.toHexString());
    }

    @Test
    @DisplayName("findById: returns null when not found")
    void findById_notFound() {
        when(driverProfileRepository.findById(profileId)).thenReturn(Optional.empty());
        when(driverProfileMapper.toResponseDTO(null)).thenReturn(null);

        DriverProfileResponseDTO result = driverProfileService.findById(profileId);

        assertThat(result).isNull();
    }
}
