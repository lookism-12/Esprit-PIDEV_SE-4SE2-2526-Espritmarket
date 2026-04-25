package esprit_market.mappers.cartMapper;

import esprit_market.dto.cartDto.LoyaltyCardResponse;
import esprit_market.entity.cart.LoyaltyCard;
import esprit_market.entity.cart.LoyaltyConfig;
import esprit_market.service.cartService.ILoyaltyConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
public class LoyaltyCardMapper {
    
    private final ILoyaltyConfigService configService;
    
    private static final int POINTS_TO_DISCOUNT_RATIO = 100;
    
    /**
     * Convert entity to Response DTO with computed fields.
     * Uses dynamic configuration from database.
     */
    public LoyaltyCardResponse toResponse(LoyaltyCard card) {
        if (card == null) return null;
        
        // Load active configuration from database
        LoyaltyConfig config = configService.getActiveConfig();
        
        LocalDate today = LocalDate.now();
        String currentLevel = card.getLevel() != null ? card.getLevel() : "BRONZE";
        int totalPoints = card.getTotalPointsEarned() != null ? card.getTotalPointsEarned() : 0;
        int currentPoints = card.getPoints() != null ? card.getPoints() : 0;
        
        // Calculate points to next level using database config
        Integer pointsToNextLevel = null;
        String nextLevel = null;
        
        switch (currentLevel.toUpperCase()) {
            case "BRONZE":
                pointsToNextLevel = config.getSilverThreshold() - totalPoints;
                nextLevel = "SILVER";
                break;
            case "SILVER":
                pointsToNextLevel = config.getGoldThreshold() - totalPoints;
                nextLevel = "GOLD";
                break;
            case "GOLD":
                pointsToNextLevel = config.getPlatinumThreshold() - totalPoints;
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
        
        // Get multiplier for current level from database config
        double multiplier = getMultiplierForLevel(currentLevel, config);
        
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
    
    /**
     * Get multiplier from database configuration based on user's level.
     * This ensures frontend displays the same multipliers used in calculations.
     */
    private double getMultiplierForLevel(String level, LoyaltyConfig config) {
        if (level == null) return config.getBronzeMultiplier();
        return switch (level.toUpperCase()) {
            case "PLATINUM" -> config.getPlatinumMultiplier();
            case "GOLD" -> config.getGoldMultiplier();
            case "SILVER" -> config.getSilverMultiplier();
            default -> config.getBronzeMultiplier();
        };
    }
}
