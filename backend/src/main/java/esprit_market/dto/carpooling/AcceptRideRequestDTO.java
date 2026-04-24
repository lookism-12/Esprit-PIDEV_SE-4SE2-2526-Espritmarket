package esprit_market.dto.carpooling;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcceptRideRequestDTO {
    @NotBlank(message = "Vehicle ID is required")
    private String vehicleId;
}
