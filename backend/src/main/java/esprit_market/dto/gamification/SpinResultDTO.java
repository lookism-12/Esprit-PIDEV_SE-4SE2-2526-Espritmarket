package esprit_market.dto.gamification;

import esprit_market.entity.gamification.RewardType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpinResultDTO {
    private String spinId;
    private RewardDTO reward;
    private Integer segmentIndex;  // Which segment on the wheel (0-based)
    private Double rotationDegrees; // Final rotation angle for animation
    private LocalDateTime expiryDate;
    private String message;
    private Boolean success;
}
