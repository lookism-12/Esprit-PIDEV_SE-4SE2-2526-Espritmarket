package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponseDTO {
    private String id;
    private String driverProfileId;
    private String make;
    private String model;
    private String licensePlate;
    private Integer numberOfSeats;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
