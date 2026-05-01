package esprit_market.service.cartService;

import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.cartDto.ConvertPointsRequest;
import esprit_market.dto.cartDto.LoyaltyCardResponse;
import esprit_market.entity.cart.LoyaltyCard;
import esprit_market.entity.cart.LoyaltyConfig;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.user.User;
import esprit_market.mappers.cartMapper.LoyaltyCardMapper;
import esprit_market.repository.cartRepository.LoyaltyCardRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyCardServiceImpl implements ILoyaltyCardService {
    private final LoyaltyCardRepository repository;
    private final UserRepository userRepository;
    private final LoyaltyCardMapper mapper;
    private final ILoyaltyConfigService configService;
    
    // ==================== LEGACY CONSTANTS ====================
    // (Only for backward compatibility - not used in new calculation)
    private static final int POINTS_PER_CURRENCY_UNIT = 1;
    private static final int POINTS_TO_DISCOUNT_RATIO = 100;

    // ==================== CORE LOYALTY LOGIC ====================

    @Override
    @Transactional
    public LoyaltyCardResponse addPointsForOrder(ObjectId userId, List<OrderItem> orderItems, Double totalAmount) {
        if (orderItems == null || orderItems.isEmpty()) {
            throw new IllegalArgumentException("Order items cannot be empty");
        }
        
        if (totalAmount == null || totalAmount <= 0) {
            throw new IllegalArgumentException("Invalid total amount");
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        LoyaltyCard card = repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
        
        // Calculate points using the new formula
        int earnedPoints = calculatePointsForOrderInternal(card.getLevel(), orderItems, totalAmount);
        
        log.info("User {} earned {} loyalty points for order (total: {})", 
                userId, earnedPoints, totalAmount);
        
        // Update loyalty card
        card.setPoints(card.getPoints() + earnedPoints);
        card.setTotalPointsEarned(card.getTotalPointsEarned() + earnedPoints);
        card.setLevel(calculateLevel(card.getTotalPointsEarned()));
        card.setPointsExpireAt(LocalDate.now().plusYears(1));
        
        LoyaltyCard updated = repository.save(card);
        return mapper.toResponse(updated);
    }
    
    @Override
    public int calculatePointsForOrder(ObjectId userId, List<OrderItem> orderItems, Double totalAmount) {
        if (orderItems == null || orderItems.isEmpty() || totalAmount == null || totalAmount <= 0) {
            return 0;
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return calculatePointsForOrderInternal("BRONZE", orderItems, totalAmount);
        }
        
        LoyaltyCard card = repository.findByUser(user).orElse(null);
        String level = (card != null) ? card.getLevel() : "BRONZE";
        
        return calculatePointsForOrderInternal(level, orderItems, totalAmount);
    }
    
    /**
     * Internal method to calculate points based on the REDESIGNED requirements:
     * 
     * 🎯 NEW FORMULA (Realistic & User-Friendly):
     * 1. Base points = orderAmount * baseRate (1:1 ratio by default)
     * 2. Apply tier multiplier (Bronze: 1.0x, Silver: 1.2x, Gold: 1.5x, Platinum: 2.0x)
     * 3. Add quantity bonus (50 points for 5+ items)
     * 4. Add high-value bonus (100 points for 200+ TND orders)
     * 
     * Examples with default config:
     * - 100 TND order (Bronze): 100 * 1.0 = 100 points
     * - 500 TND order (Gold): 500 * 1.5 + 100 = 850 points
     * - 1000 TND order (Platinum): 1000 * 2.0 + 100 + 50 = 2150 points
     */
    private int calculatePointsForOrderInternal(String level, List<OrderItem> orderItems, Double totalAmount) {
        // ==================== LOAD DYNAMIC CONFIGURATION ====================
        LoyaltyConfig config = configService.getActiveConfig();
        
        // Use BigDecimal for high precision calculations
        BigDecimal baseRate = BigDecimal.valueOf(config.getBaseRate() != null ? config.getBaseRate() : 1.0);
        BigDecimal orderAmountDecimal = BigDecimal.valueOf(totalAmount);
        int totalQuantity = 0;
        
        // Count total quantity for bonus calculation
        for (OrderItem item : orderItems) {
            if (item.getQuantity() != null) {
                totalQuantity += item.getQuantity();
            }
        }
        
        // ==================== STEP 1: Calculate Base Points ====================
        // Simple formula: orderAmount * baseRate (e.g., 100 TND * 1.0 = 100 points)
        BigDecimal basePoints = orderAmountDecimal.multiply(baseRate);
        
        log.debug("💰 Order Amount: {} TND", totalAmount);
        log.debug("📊 Base Rate: {}", baseRate.toPlainString());
        log.debug("🎯 Base Points: {}", basePoints.toPlainString());
        
        // ==================== STEP 2: Add Fixed Bonuses ====================
        BigDecimal bonusPoints = BigDecimal.ZERO;
        
        if (totalQuantity >= config.getBonusQuantityThreshold()) {
            bonusPoints = bonusPoints.add(BigDecimal.valueOf(config.getBonusQuantity()));
            log.debug("🎁 Quantity bonus ({}+ items): +{} points", 
                    config.getBonusQuantityThreshold(), config.getBonusQuantity());
        }
        
        if (totalAmount > config.getBonusHighOrderThreshold()) {
            bonusPoints = bonusPoints.add(BigDecimal.valueOf(config.getBonusHighOrder()));
            log.debug("🎁 High-value bonus ({}+ TND): +{} points", 
                    config.getBonusHighOrderThreshold(), config.getBonusHighOrder());
        }
        
        // ==================== STEP 3: Apply Tier Multiplier ====================
        BigDecimal multiplier = BigDecimal.valueOf(getPointsMultiplierFromConfig(level, config));
        BigDecimal totalBeforeMultiplier = basePoints.add(bonusPoints);
        
        // Final Points = (Base + Bonuses) * Multiplier
        BigDecimal finalPointsDecimal = totalBeforeMultiplier.multiply(multiplier);
        
        // Round to nearest integer (HALF_UP is standard financial rounding)
        int finalPoints = finalPointsDecimal.setScale(0, java.math.RoundingMode.HALF_UP).intValue();
        
        // Ensure minimum 1 point for any non-empty order
        if (!orderItems.isEmpty() && finalPoints < 1) {
            finalPoints = 1;
        }
        
        log.info("🏆 LOYALTY CALCULATION - Order: {} TND | Base: {} pts | Bonuses: {} pts | Level: {} ({}x) | FINAL: {} pts", 
                String.format("%.2f", totalAmount),
                basePoints.setScale(0, java.math.RoundingMode.HALF_UP).toPlainString(),
                bonusPoints.toPlainString(),
                level, 
                multiplier.toPlainString(),
                finalPoints);
        
        return finalPoints;
    }

    // ==================== LEGACY METHODS (Backward Compatibility) ====================

    @Override
    @Transactional
    @Deprecated
    public LoyaltyCardResponse addPointsForCart(ObjectId userId, Double cartTotal) {
        log.warn("Using deprecated addPointsForCart method. Consider using addPointsForOrder instead.");
        
        if (cartTotal == null || cartTotal <= 0) {
            throw new IllegalArgumentException("Invalid cart total");
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
        
        double multiplier = getPointsMultiplier(card.getLevel());
        int earnedPoints = (int) (cartTotal * POINTS_PER_CURRENCY_UNIT * multiplier);
        
        card.setPoints(card.getPoints() + earnedPoints);
        card.setTotalPointsEarned(card.getTotalPointsEarned() + earnedPoints);
        card.setLevel(calculateLevel(card.getTotalPointsEarned()));
        card.setPointsExpireAt(LocalDate.now().plusYears(1));
        
        LoyaltyCard updated = repository.save(card);
        return mapper.toResponse(updated);
    }

    // ==================== CRUD OPERATIONS ====================

    @Override
    @Transactional
    public LoyaltyCardResponse getOrCreateLoyaltyCard(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
        return mapper.toResponse(card);
    }

    @Override
    public LoyaltyCardResponse getLoyaltyCardByUserId(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Loyalty card not found for user"));
        return mapper.toResponse(card);
    }
    
    private LoyaltyCard createNewLoyaltyCard(User user) {
        LoyaltyCard card = LoyaltyCard.builder()
            .user(user)
            .points(0)
            .level("BRONZE")
            .totalPointsEarned(0)
            .pointsExpireAt(LocalDate.now().plusYears(1))
            .convertedToDiscount(0.0)
            .build();
        
        return repository.save(card);
    }

    // ==================== POINTS CONVERSION ====================

    @Override
    @Transactional
    public LoyaltyCardResponse convertPointsToDiscount(ObjectId userId, ConvertPointsRequest request) {
        if (request.getPoints() == null || request.getPoints() <= 0) {
            throw new IllegalArgumentException("Points to convert must be greater than 0");
        }
        
        if (request.getPoints() % POINTS_TO_DISCOUNT_RATIO != 0) {
            throw new IllegalArgumentException("Points must be in multiples of " + POINTS_TO_DISCOUNT_RATIO);
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Loyalty card not found"));
        
        if (card.getPoints() < request.getPoints()) {
            throw new IllegalArgumentException("Insufficient points. Available: " + card.getPoints());
        }
        
        double discountValue = request.getPoints() / (double) POINTS_TO_DISCOUNT_RATIO;
        
        card.setPoints(card.getPoints() - request.getPoints());
        card.setConvertedToDiscount(
            (card.getConvertedToDiscount() != null ? card.getConvertedToDiscount() : 0.0) + discountValue
        );
        
        LoyaltyCard updated = repository.save(card);
        return mapper.toResponse(updated);
    }

    @Override
    @Transactional
    public LoyaltyCardResponse addPoints(ObjectId userId, Integer points) {
        if (points == null || points <= 0) {
            throw new IllegalArgumentException("Points must be greater than 0");
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
        
        card.setPoints(card.getPoints() + points);
        card.setTotalPointsEarned(card.getTotalPointsEarned() + points);
        card.setLevel(calculateLevel(card.getTotalPointsEarned()));
        
        LoyaltyCard updated = repository.save(card);
        return mapper.toResponse(updated);
    }

    // ==================== UTILITY METHODS ====================

    @Override
    public String calculateLevel(Integer totalPoints) {
        if (totalPoints == null) return "BRONZE";
        
        // ✅ DYNAMIC: Load thresholds from configuration
        LoyaltyConfig config = configService.getActiveConfig();
        
        if (totalPoints >= config.getPlatinumThreshold()) {
            return "PLATINUM";
        } else if (totalPoints >= config.getGoldThreshold()) {
            return "GOLD";
        } else if (totalPoints >= config.getSilverThreshold()) {
            return "SILVER";
        } else {
            return "BRONZE";
        }
    }
    
    @Override
    public double getPointsMultiplier(String level) {
        LoyaltyConfig config = configService.getActiveConfig();
        return getPointsMultiplierFromConfig(level, config);
    }
    
    /**
     * Get multiplier from configuration based on level
     */
    private double getPointsMultiplierFromConfig(String level, LoyaltyConfig config) {
        if (level == null) return config.getBronzeMultiplier();
        
        return switch (level.toUpperCase()) {
            case "PLATINUM" -> config.getPlatinumMultiplier();
            case "GOLD" -> config.getGoldMultiplier();
            case "SILVER" -> config.getSilverMultiplier();
            default -> config.getBronzeMultiplier();
        };
    }
    
    @Override
    @Transactional
    public int deductPoints(ObjectId userId, Integer pointsToDeduct) {
        if (pointsToDeduct == null || pointsToDeduct <= 0) {
            return 0;
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return 0;
        }
        
        LoyaltyCard card = repository.findByUser(user).orElse(null);
        if (card == null) {
            return 0;
        }
        
        int currentPoints = card.getPoints() != null ? card.getPoints() : 0;
        int actualDeduction = Math.min(currentPoints, pointsToDeduct);
        
        if (actualDeduction > 0) {
            card.setPoints(currentPoints - actualDeduction);
            repository.save(card);
            log.info("Deducted {} points from user {}", actualDeduction, userId);
        }
        
        return actualDeduction;
    }
    
    @Override
    public int calculatePointsForAmount(ObjectId userId, Double amount) {
        if (amount == null || amount <= 0) {
            return 0;
        }
        
        // ✅ REDESIGNED: Load configuration from database
        LoyaltyConfig config = configService.getActiveConfig();
        
        User user = userRepository.findById(userId).orElse(null);
        String level = "BRONZE"; // Default level
        
        if (user != null) {
            LoyaltyCard card = repository.findByUser(user).orElse(null);
            if (card != null) {
                level = card.getLevel();
            }
        }
        
        // ✅ NEW CALCULATION: Simple and realistic
        // Base points = amount * baseRate (e.g., 100 TND * 1.0 = 100 points)
        BigDecimal basePoints = BigDecimal.valueOf(amount).multiply(BigDecimal.valueOf(config.getBaseRate()));
        BigDecimal multiplier = BigDecimal.valueOf(getPointsMultiplierFromConfig(level, config));
        
        // Apply tier multiplier
        BigDecimal finalPoints = basePoints.multiply(multiplier);
        
        return Math.max(1, finalPoints.setScale(0, java.math.RoundingMode.HALF_UP).intValue());
    }
    
    /**
     * ✅ NEW METHOD: Calculate maximum discount available from points
     */
    public double calculateMaxDiscountFromPoints(ObjectId userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return 0.0;
        
        LoyaltyCard card = repository.findByUser(user).orElse(null);
        if (card == null) return 0.0;
        
        LoyaltyConfig config = configService.getActiveConfig();
        int availablePoints = card.getPoints() != null ? card.getPoints() : 0;
        int maxUsablePoints = config.getMaxPointsPerOrder() != null ? 
            Math.min(availablePoints, config.getMaxPointsPerOrder()) : availablePoints;
        
        // Convert points to currency (e.g., 10 points = 1 TND)
        double maxDiscount = maxUsablePoints * config.getPointsToCurrencyRate();
        
        log.debug("💰 User {} can use {} points for {} TND discount", 
                userId, maxUsablePoints, String.format("%.2f", maxDiscount));
        
        return maxDiscount;
    }
    
    /**
     * ✅ NEW METHOD: Apply points discount to order
     */
    @Transactional
    public double applyPointsDiscount(ObjectId userId, int pointsToUse, double orderAmount) {
        if (pointsToUse <= 0) return 0.0;
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Loyalty card not found"));
        
        LoyaltyConfig config = configService.getActiveConfig();
        
        // Validate points usage
        int availablePoints = card.getPoints() != null ? card.getPoints() : 0;
        if (pointsToUse > availablePoints) {
            throw new IllegalArgumentException("Insufficient points. Available: " + availablePoints);
        }
        
        int maxUsablePoints = config.getMaxPointsPerOrder() != null ? config.getMaxPointsPerOrder() : Integer.MAX_VALUE;
        if (pointsToUse > maxUsablePoints) {
            throw new IllegalArgumentException("Cannot use more than " + maxUsablePoints + " points per order");
        }
        
        // Calculate discount
        double discountAmount = pointsToUse * config.getPointsToCurrencyRate();
        
        // Ensure discount doesn't exceed order amount
        discountAmount = Math.min(discountAmount, orderAmount);
        
        // Deduct points
        card.setPoints(availablePoints - pointsToUse);
        repository.save(card);
        
        log.info("✅ Applied {} points discount: {} TND for user {}", 
                pointsToUse, String.format("%.2f", discountAmount), userId);
        
        return discountAmount;
    }
    
    public LoyaltyCard getOrCreateLoyaltyCardEntity(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
    }
}