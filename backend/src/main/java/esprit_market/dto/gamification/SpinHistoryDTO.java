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
public class SpinHistoryDTO {
    private String id;
    private String userId;
    private String rewardId;
    private String rewardLabel;
    private RewardType rewardType;
    private Double rewardValue;
    private LocalDateTime spinTimestamp;
    private Boolean claimed;
    private LocalDateTime claimedAt;
    private LocalDateTime expiryDate;
}
