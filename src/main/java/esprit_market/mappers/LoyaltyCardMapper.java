package esprit_market.mappers;

import esprit_market.dto.LoyaltyCardResponse;
import esprit_market.entity.cart.LoyaltyCard;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
public class LoyaltyCardMapper {
    
    private static final int POINTS_TO_DISCOUNT_RATIO = 100;
    
    // Level thresholds
    private static final int SILVER_THRESHOLD = 1000;
    private static final int GOLD_THRESHOLD = 5000;
    private static final int PLATINUM_THRESHOLD = 10000;
    
    // Points multipliers
    private static final double BRONZE_MULTIPLIER = 1.0;
    private static final double SILVER_MULTIPLIER = 1.5;
    private static final double GOLD_MULTIPLIER = 2.0;
    private static final double PLATINUM_MULTIPLIER = 3.0;
    
    /**
     * Convert entity to Response DTO with computed fields.
     */
    public LoyaltyCardResponse toResponse(LoyaltyCard card) {
        if (card == null) return null;
        
        LocalDate today = LocalDate.now();
        String currentLevel = card.getLevel() != null ? card.getLevel() : "BRONZE";
        int totalPoints = card.getTotalPointsEarned() != null ? card.getTotalPointsEarned() : 0;
        int currentPoints = card.getPoints() != null ? card.getPoints() : 0;
        
        // Calculate points to next level
        Integer pointsToNextLevel = null;
        String nextLevel = null;
        
        switch (currentLevel.toUpperCase()) {
            case "BRONZE":
                pointsToNextLevel = SILVER_THRESHOLD - totalPoints;
                nextLevel = "SILVER";
                break;
            case "SILVER":
                pointsToNextLevel = GOLD_THRESHOLD - totalPoints;
                nextLevel = "GOLD";
                break;
            case "GOLD":
                pointsToNextLevel = PLATINUM_THRESHOLD - totalPoints;
                nextLevel = "PLATINUM";
                break;
            case "PLATINUM":
                pointsToNextLevel = 0;
                nextLevel = "PLATINUM (MAX)";
                break;
        }
        
        if (pointsToNextLevel != null && pointsToNextLevel < 0) {
            pointsToNextLevel = 0;
        }
        
        // Calculate days until expiration
        Integer daysUntilExpiration = null;
        Boolean isExpiringSoon = false;
        if (card.getPointsExpireAt() != null && !card.getPointsExpireAt().isBefore(today)) {
            daysUntilExpiration = (int) ChronoUnit.DAYS.between(today, card.getPointsExpireAt());
            isExpiringSoon = daysUntilExpiration <= 30;
        }
        
        // Points value in currency
        double pointsValueInCurrency = currentPoints / (double) POINTS_TO_DISCOUNT_RATIO;
        
        // Get multiplier for current level
        double multiplier = getMultiplierForLevel(currentLevel);
        
        return LoyaltyCardResponse.builder()
            .id(card.getId() != null ? card.getId().toHexString() : null)
            .userId(card.getUserId() != null ? card.getUserId().toHexString() : null)
            .points(card.getPoints())
            .level(card.getLevel())
            .totalPointsEarned(card.getTotalPointsEarned())
            .pointsExpireAt(card.getPointsExpireAt())
            .convertedToDiscount(card.getConvertedToDiscount())
            .pointsToNextLevel(pointsToNextLevel)
            .nextLevel(nextLevel)
            .pointsMultiplier(multiplier)
            .pointsValueInCurrency(pointsValueInCurrency)
            .daysUntilExpiration(daysUntilExpiration)
            .isExpiringSoon(isExpiringSoon)
            .build();
    }
    
    private double getMultiplierForLevel(String level) {
        if (level == null) return BRONZE_MULTIPLIER;
        return switch (level.toUpperCase()) {
            case "PLATINUM" -> PLATINUM_MULTIPLIER;
            case "GOLD" -> GOLD_MULTIPLIER;
            case "SILVER" -> SILVER_MULTIPLIER;
            default -> BRONZE_MULTIPLIER;
        };
    }
}
