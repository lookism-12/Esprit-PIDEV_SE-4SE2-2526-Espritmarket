package esprit_market.mappers.carpooling;

import esprit_market.dto.carpooling.PassengerProfileResponseDTO;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.entity.user.User;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class PassengerProfileMapper {

    private final UserRepository userRepository;

    public PassengerProfileResponseDTO toResponseDTO(PassengerProfile profile) {
        if (profile == null)
            return null;

        String fullName = "";
        String email = "";

        if (profile.getUserId() != null) {
            User user = userRepository.findById(profile.getUserId()).orElse(null);
            if (user != null) {
                fullName = user.getFirstName() + " " + user.getLastName();
                email = user.getEmail();
            }
        }

        return PassengerProfileResponseDTO.builder()
                .id(profile.getId() != null ? profile.getId().toHexString() : null)
                .userId(profile.getUserId() != null ? profile.getUserId().toHexString() : null)
                .fullName(fullName)
                .email(email)
                .averageRating(profile.getAverageRating())
                .preferences(profile.getPreferences())
                .bookingIds(profile.getBookingIds() != null
                        ? profile.getBookingIds().stream().map(ObjectId::toHexString).collect(Collectors.toList())
                        : Collections.emptyList())
                .totalRidesCompleted(profile.getTotalRidesCompleted())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
