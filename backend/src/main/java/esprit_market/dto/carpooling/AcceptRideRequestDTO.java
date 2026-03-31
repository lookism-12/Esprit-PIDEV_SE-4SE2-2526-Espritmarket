package esprit_market.dto.carpooling;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AcceptRideRequestDTO {
    @NotBlank(message = "Vehicle ID is required to accept a ride request")
    private String vehicleId;
}
