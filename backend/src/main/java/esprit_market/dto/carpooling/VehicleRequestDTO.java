package esprit_market.dto.carpooling;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleRequestDTO {

    @NotBlank(message = "Make is required")
    private String make;

    @NotBlank(message = "Model is required")
    private String model;

    @NotBlank(message = "License plate is required")
    @Pattern(regexp = "^[A-Z0-9-]{2,15}$", message = "Invalid license plate format")
    private String licensePlate;

    @NotNull
    @Min(value = 1, message = "At least 1 seat required")
    private Integer numberOfSeats;
}
