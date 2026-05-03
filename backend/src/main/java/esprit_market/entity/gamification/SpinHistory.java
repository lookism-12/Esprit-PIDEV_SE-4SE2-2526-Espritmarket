package esprit_market.entity.gamification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * History of wheel spins by users
 */
@Document(collection = "spin_history")
@CompoundIndex(name = "user_date_idx", def = "{'userId': 1, 'spinDate': 1}")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpinHistory {
    
    @Id
    private ObjectId id;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    /**
     * User who performed the spin
     */
    private ObjectId userId;
    
    /**
     * Reward won
     */
    private ObjectId rewardId;
    
    /**
     * Date of the spin (for daily limit check)
     */
    private LocalDate spinDate;
    
    /**
     * Full timestamp of the spin
     */
    private LocalDateTime spinTimestamp;
    
    /**
     * Whether the reward was claimed/used
     */
    @Builder.Default
    private Boolean claimed = false;
    
    /**
     * When the reward was claimed
     */
    private LocalDateTime claimedAt;
    
    /**
     * IP address for anti-cheat
     */
    private String ipAddress;
    
    /**
     * User agent for anti-cheat
     */
    private String userAgent;
    
    /**
     * Reward details snapshot (in case reward is deleted later)
     */
    private String rewardLabel;
    private RewardType rewardType;
    private Double rewardValue;
    
    /**
     * Expiry date of the reward
     */
    private LocalDateTime expiryDate;
}
