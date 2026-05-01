package esprit_market.dto.cartDto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to convert points into a reward
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConvertPointsToRewardRequest {
    
    @NotNull(message = "Reward ID is required")
    private String rewardId;
}
