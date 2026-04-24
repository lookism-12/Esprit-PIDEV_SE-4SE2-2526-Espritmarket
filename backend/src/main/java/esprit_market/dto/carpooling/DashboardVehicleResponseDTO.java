package esprit_market.dto.carpooling;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardVehicleResponseDTO {
    private String vehicleId;
    private String registrationNumber;
    private String make;
    private String model;
    private Integer seatingCapacity;
    private Boolean isActive;
}
