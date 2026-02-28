package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.PassengerProfileRequestDTO;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.user.User;
import esprit_market.Enum.userEnum.Role;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.annotation.Lazy;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PassengerProfileService implements IPassengerProfileService {

    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final @Lazy IBookingService bookingService;

    @Override
    public List<PassengerProfile> findAll() {
        return passengerProfileRepository.findAll();
    }

    @Override
    public PassengerProfile findById(ObjectId id) {
        return passengerProfileRepository.findById(id).orElse(null);
    }

    @Override
    public PassengerProfile findByUserId(ObjectId userId) {
        return passengerProfileRepository.findByUserId(userId).orElse(null);
    }

    @Override
    public PassengerProfile save(PassengerProfile profile) {
        return passengerProfileRepository.save(profile);
    }

    @Override
    public PassengerProfile update(ObjectId id, PassengerProfile profile) {
        PassengerProfile existing = passengerProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Passenger profile not found"));
        existing.setPreferences(profile.getPreferences());
        return passengerProfileRepository.save(existing);
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
                bookingService.cancelBooking(booking.getId().toHexString(), passengerEmail, profile.getId());
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

    public PassengerProfile registerPassenger(String userEmail, PassengerProfileRequestDTO dto) {
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
        return profile;
    }
}
