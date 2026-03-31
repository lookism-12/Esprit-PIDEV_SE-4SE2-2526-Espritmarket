package esprit_market.mappers.carpooling;


import esprit_market.dto.carpoolingDto.DriverProfileResponseDTO;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.entity.user.User;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DriverProfileMapper {

    private final UserRepository userRepository;

    public DriverProfileResponseDTO toResponseDTO(DriverProfile profile) {
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

        return DriverProfileResponseDTO.builder()
                .id(profile.getId() != null ? profile.getId().toHexString() : null)
                .userId(profile.getUserId() != null ? profile.getUserId().toHexString() : null)
                .fullName(fullName)
                .email(email)
                .licenseNumber(profile.getLicenseNumber())
                .licenseDocument(profile.getLicenseDocument())
                .isVerified(profile.getIsVerified())
                .averageRating(profile.getAverageRating())
                .totalRidesCompleted(profile.getTotalRidesCompleted())
                .totalEarnings(profile.getTotalEarnings())
                .rideIds(profile.getRideIds() != null
                        ? profile.getRideIds().stream().map(ObjectId::toHexString).collect(Collectors.toList())
                        : Collections.emptyList())
                .vehicleIds(profile.getVehicleIds() != null
                        ? profile.getVehicleIds().stream().map(ObjectId::toHexString).collect(Collectors.toList())
                        : Collections.emptyList())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
