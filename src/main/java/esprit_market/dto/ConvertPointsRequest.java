package esprit_market.dto;

import lombok.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConvertPointsRequest {
    @NotNull(message = "Points are required")
    @Positive(message = "Points must be positive")
    private Integer points;
}
