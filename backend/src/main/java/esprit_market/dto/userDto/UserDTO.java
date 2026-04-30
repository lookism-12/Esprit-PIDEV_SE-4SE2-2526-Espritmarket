package esprit_market.dto.userDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String avatarUrl;
    private List<String> roles;
    private boolean enabled;

    // Client/Passenger fields
    private String address;

    // Provider fields
    private String businessName;
    private String businessType;
    private String taxId;
    private String description;

    // Driver fields
    private String drivingLicenseNumber;

    // Logistics fields (Driver & Delivery)
    private String vehicleType;

    // Delivery fields
    private String deliveryZone;
    private Double currentLatitude;
    private Double currentLongitude;
    private String lastLocationUpdatedAt;
}
