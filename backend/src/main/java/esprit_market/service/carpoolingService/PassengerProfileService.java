package esprit_market.service.carpoolingService;

import esprit_market.dto.carpoolingDto.PassengerProfileRequestDTO;
import esprit_market.dto.carpoolingDto.PassengerProfileResponseDTO;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.user.User;
import esprit_market.Enum.userEnum.Role;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.mappers.carpooling.PassengerProfileMapper;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PassengerProfileService implements IPassengerProfileService {

    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final @Lazy IBookingService bookingService;
    private final PassengerProfileMapper passengerProfileMapper;

    @Override
    public List<PassengerProfileResponseDTO> findAll() {
        return passengerProfileRepository.findAll().stream()
                .map(passengerProfileMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public PassengerProfileResponseDTO findById(ObjectId id) {
        return passengerProfileMapper.toResponseDTO(passengerProfileRepository.findById(id).orElse(null));
    }

    @Override
    public PassengerProfileResponseDTO findByUserId(ObjectId userId) {
        return passengerProfileMapper.toResponseDTO(passengerProfileRepository.findByUserId(userId).orElse(null));
    }

    @Override
    public PassengerProfile save(PassengerProfile profile) {
        return passengerProfileRepository.save(profile);
    }

    @Override
    public PassengerProfileResponseDTO update(ObjectId id, PassengerProfile profile) {
        PassengerProfile existing = passengerProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
        existing.setPreferences(profile.getPreferences());
        return passengerProfileMapper.toResponseDTO(passengerProfileRepository.save(existing));
    }

    @Override
    @Transactional
    public void delete(ObjectId id) {
        PassengerProfile profile = passengerProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));

        // Part 2 #4: Cascade delete logic for PassengerProfile
        // 1. Cancel all confirmed/pending bookings
        List<esprit_market.entity.carpooling.Booking> bookings = bookingRepository.findByPassengerProfileId(id);
        User passengerUser = userRepository.findById(profile.getUserId()).orElse(null);
        String passengerEmail = passengerUser != null ? passengerUser.getEmail() : null;

        for (esprit_market.entity.carpooling.Booking booking : bookings) {
            if (booking.getStatus() == esprit_market.Enum.carpoolingEnum.BookingStatus.CONFIRMED ||
                    booking.getStatus() == esprit_market.Enum.carpoolingEnum.BookingStatus.PENDING) {
                if (passengerEmail != null) {
                    bookingService.cancelBooking(booking.getId().toHexString(), passengerEmail);
                }
            }
        }

        // 2. Remove PASSENGER role from User
        userRepository.findById(profile.getUserId()).ifPresent(user -> {
            if (user.getRoles() != null) {
                user.getRoles().remove(esprit_market.Enum.userEnum.Role.PASSENGER);
                userRepository.save(user);
            }
        });

        // 3. Delete Profile
        passengerProfileRepository.deleteById(id);
    }

    public PassengerProfileResponseDTO registerPassenger(PassengerProfileRequestDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (passengerProfileRepository.existsByUserId(user.getId())) {
            throw new IllegalStateException("Passenger profile already exists for this user");
        }
        PassengerProfile profile = PassengerProfile.builder()
                .userId(user.getId())
                .averageRating(0f)
                .preferences(dto.getPreferences() != null ? dto.getPreferences() : "")
                .build();
        profile = passengerProfileRepository.save(profile);
        user.setPassengerProfileId(profile.getId());
        if (user.getRoles() != null && !user.getRoles().contains(Role.PASSENGER)) {
            user.getRoles().add(Role.PASSENGER);
        } else if (user.getRoles() == null) {
            user.setRoles(List.of(Role.PASSENGER));
        }
        userRepository.save(user);
        return passengerProfileMapper.toResponseDTO(profile);
    }

    @Override
    public PassengerProfileResponseDTO getMyProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return passengerProfileMapper.toResponseDTO(passengerProfileRepository.findByUserId(user.getId()).orElse(null));
    }

    @Override
    public void incrementTotalRides(ObjectId passengerProfileId) {
        PassengerProfile passenger = passengerProfileRepository.findById(passengerProfileId).orElse(null);
        if (passenger != null) {
            passenger.setTotalRidesCompleted(
                    passenger.getTotalRidesCompleted() != null ? passenger.getTotalRidesCompleted() + 1 : 1);
            passengerProfileRepository.save(passenger);
        }
    }
}
