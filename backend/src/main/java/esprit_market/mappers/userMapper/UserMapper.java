package esprit_market.mappers.userMapper;

import esprit_market.dto.userDto.UserDTO;
import esprit_market.entity.user.User;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class UserMapper {

    public UserDTO toDTO(User user) {
        if (user == null) {
            return null;
        }

        return UserDTO.builder()
                .id(user.getId() != null ? user.getId().toHexString() : null)
                .firstName(user.getFirstName() != null ? user.getFirstName() : "")
                .lastName(user.getLastName() != null ? user.getLastName() : "")
                .email(user.getEmail())
                .phone(user.getPhone() != null ? user.getPhone() : "")
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles() != null 
                        ? user.getRoles().stream().map(Enum::name).collect(Collectors.toList())
                        : null)
                .enabled(user.isEnabled())
                .notificationsEnabled(user.isNotificationsEnabled())
                .internalNotificationsEnabled(user.isInternalNotificationsEnabled())
                .externalNotificationsEnabled(user.isExternalNotificationsEnabled())
                // Client/Passenger fields
                .address(user.getAddress())
                // Provider fields
                .businessName(user.getBusinessName())
                .businessType(user.getBusinessType())
                .taxId(user.getTaxId())
                .description(user.getDescription())
                // Driver fields
                .drivingLicenseNumber(user.getDrivingLicenseNumber())
                // Logistics fields
                .vehicleType(user.getVehicleType())
                // Delivery fields
                .deliveryZone(user.getDeliveryZone())
                .build();
    }
}

