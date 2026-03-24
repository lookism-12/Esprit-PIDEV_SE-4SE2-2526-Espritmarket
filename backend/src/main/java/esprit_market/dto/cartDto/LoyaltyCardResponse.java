package esprit_market.dto.cartDto;

import lombok.*;

import java.time.LocalDate;

/**
 * Response DTO for loyalty card data returned to clients.
 * LoyaltyCard is read-only for clients (no create/update requests needed).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyCardResponse {
    
    private String id;
    
    private String userId;
    
    private Integer points;
    
    private String level;
    
    private Integer totalPointsEarned;
    
    private LocalDate pointsExpireAt;
    
    private Double convertedToDiscount;
    
    // Computed fields for client convenience
    private Integer pointsToNextLevel;
    
    private String nextLevel;
    
    private Double pointsMultiplier;
    
    private Double pointsValueInCurrency;
    
    private Integer daysUntilExpiration;
    
    private Boolean isExpiringSoon;
}
