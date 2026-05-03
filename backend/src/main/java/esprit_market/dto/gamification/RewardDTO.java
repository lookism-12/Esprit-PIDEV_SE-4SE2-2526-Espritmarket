package esprit_market.dto.gamification;

import esprit_market.entity.gamification.RewardType;
import esprit_market.entity.gamification.UserSegment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardDTO {
    private String id;
    private String label;
    private RewardType type;
    private Double value;
    private Integer probability;
    private Boolean active;
    private String color;
    private String icon;
    private String description;
    private String couponCode;
    private Double minOrderValue;
    private Integer expiryDays;
    private UserSegment targetSegment;
}
