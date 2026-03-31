package esprit_market.service.carpoolingService;

import esprit_market.Enum.userEnum.Role;
import esprit_market.dto.carpooling.PassengerProfileRequestDTO;
import esprit_market.dto.carpooling.PassengerProfileResponseDTO;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.PassengerProfileMapper;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
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
class PassengerProfileServiceTest {

    @Mock PassengerProfileRepository passengerProfileRepository;
    @Mock UserRepository userRepository;
    @Mock BookingRepository bookingRepository;
    @Mock IBookingService bookingService;
    @Mock PassengerProfileMapper passengerProfileMapper;

    @InjectMocks PassengerProfileService passengerProfileService;

    private ObjectId userId, profileId;
    private User user;
    private PassengerProfile profile;
    private PassengerProfileResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        userId    = new ObjectId();
        profileId = new ObjectId();

        user = User.builder()
                .id(userId).email("passenger@test.com")
                .firstName("Jane").lastName("Doe")
                .roles(new ArrayList<>(List.of(Role.CLIENT)))
                .build();

        profile = PassengerProfile.builder()
                .id(profileId).userId(userId)
                .averageRating(0f).totalRidesCompleted(0)
                .preferences("").build();

        responseDTO = PassengerProfileResponseDTO.builder()
                .id(profileId.toHexString())
                .userId(userId.toHexString())
                .fullName("Jane Doe")
                .averageRating(0f)
                .build();
    }

    // ── registerPassenger ─────────────────────────────────────────────────

    @Test
    @DisplayName("registerPassenger: success — creates profile and adds PASSENGER role")
    void registerPassenger_success() {
        PassengerProfileRequestDTO dto = new PassengerProfileRequestDTO();
        dto.setPreferences("window seat");

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.existsByUserId(userId)).thenReturn(false);
        when(passengerProfileRepository.save(any(PassengerProfile.class))).thenReturn(profile);
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(passengerProfileMapper.toResponseDTO(profile)).thenReturn(responseDTO);

        PassengerProfileResponseDTO result = passengerProfileService.registerPassenger(dto, "passenger@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(profileId.toHexString());
        verify(userRepository).save(argThat(u -> u.getRoles().contains(Role.PASSENGER)));
    }

    @Test
    @DisplayName("registerPassenger: throws when profile already exists")
    void registerPassenger_alreadyExists() {
        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.existsByUserId(userId)).thenReturn(true);

        assertThatThrownBy(() -> passengerProfileService.registerPassenger(
                new PassengerProfileRequestDTO(), "passenger@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    @DisplayName("registerPassenger: throws when user not found")
    void registerPassenger_userNotFound() {
        when(userRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> passengerProfileService.registerPassenger(
                new PassengerProfileRequestDTO(), "nobody@test.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }

    // ── getMyProfile ──────────────────────────────────────────────────────

    @Test
    @DisplayName("getMyProfile: returns null when no profile exists (orElse null)")
    void getMyProfile_noProfile() {
        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(passengerProfileMapper.toResponseDTO(null)).thenReturn(null);

        PassengerProfileResponseDTO result = passengerProfileService.getMyProfile("passenger@test.com");

        assertThat(result).isNull();
    }

    @Test
    @DisplayName("getMyProfile: returns DTO when profile exists")
    void getMyProfile_success() {
        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(user));
        when(passengerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(profile));
        when(passengerProfileMapper.toResponseDTO(profile)).thenReturn(responseDTO);

        PassengerProfileResponseDTO result = passengerProfileService.getMyProfile("passenger@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getFullName()).isEqualTo("Jane Doe");
    }

    // ── incrementTotalRides ───────────────────────────────────────────────

    @Test
    @DisplayName("incrementTotalRides: increments counter from 0 to 1")
    void incrementTotalRides_fromZero() {
        profile.setTotalRidesCompleted(0);
        when(passengerProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        passengerProfileService.incrementTotalRides(profileId);

        verify(passengerProfileRepository).save(argThat(p -> p.getTotalRidesCompleted() == 1));
    }

    @Test
    @DisplayName("incrementTotalRides: increments counter from null to 1")
    void incrementTotalRides_fromNull() {
        profile.setTotalRidesCompleted(null);
        when(passengerProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));

        passengerProfileService.incrementTotalRides(profileId);

        verify(passengerProfileRepository).save(argThat(p -> p.getTotalRidesCompleted() == 1));
    }

    @Test
    @DisplayName("incrementTotalRides: does nothing when profile not found")
    void incrementTotalRides_profileNotFound() {
        when(passengerProfileRepository.findById(profileId)).thenReturn(Optional.empty());

        passengerProfileService.incrementTotalRides(profileId);

        verify(passengerProfileRepository, never()).save(any());
    }

    // ── update ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update: updates preferences and saves")
    void update_success() {
        PassengerProfile updated = PassengerProfile.builder()
                .id(profileId).userId(userId).preferences("aisle seat").build();
        PassengerProfileResponseDTO updatedDTO = PassengerProfileResponseDTO.builder()
                .id(profileId.toHexString()).build();

        when(passengerProfileRepository.findById(profileId)).thenReturn(Optional.of(profile));
        when(passengerProfileRepository.save(any())).thenReturn(updated);
        when(passengerProfileMapper.toResponseDTO(updated)).thenReturn(updatedDTO);

        PassengerProfile patchProfile = new PassengerProfile();
        patchProfile.setPreferences("aisle seat");

        PassengerProfileResponseDTO result = passengerProfileService.update(profileId, patchProfile);

        assertThat(result).isNotNull();
        verify(passengerProfileRepository).save(argThat(p -> "aisle seat".equals(p.getPreferences())));
    }
}
