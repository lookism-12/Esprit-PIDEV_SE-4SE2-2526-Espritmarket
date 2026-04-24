package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfileResponseDTO {
    private String id;
    private String userId;
    private String fullName;
    private String email;
    private String licenseNumber;
    private String licenseDocument;
    private Boolean isVerified;
    private Float averageRating;
    private Integer totalRidesCompleted;
    private Float totalEarnings;
    private Float driverScore;
    private String badge;
    private List<String> rideIds;
    private List<String> vehicleIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
