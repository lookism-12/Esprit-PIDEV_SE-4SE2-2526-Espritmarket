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
     * Internal method to calculate points based on the requirements:
     * 
     * 1. Base points = sum(productPrice * quantity * 0.1)
     * 2. Apply tier multiplier
     * 3. Add quantity bonus (if total quantity >= 5)
     * 4. Add price bonus (if total > 200)
     */
    private int calculatePointsForOrderInternal(String level, List<OrderItem> orderItems, Double totalAmount) {
        // ==================== LOAD DYNAMIC CONFIGURATION ====================
        LoyaltyConfig config = configService.getActiveConfig();
        
        // ==================== STEP 1: Calculate Base Points ====================
        // ✅ DYNAMIC: Load base rate from database configuration
        double basePoints = 0.0;
        int totalQuantity = 0;
        
        for (OrderItem item : orderItems) {
            if (item.getProductPrice() != null && item.getQuantity() != null) {
                double itemPoints = item.getProductPrice() * item.getQuantity() * config.getBaseRate();
                basePoints += itemPoints;
                totalQuantity += item.getQuantity();
                
                log.debug("📦 Item: {} x {} @ ${} = {:.2f} base points", 
                        item.getProductName(), item.getQuantity(), 
                        item.getProductPrice(), itemPoints);
            }
        }
        
        // ✅ Ensure minimum 1 point for any purchase
        basePoints = Math.max(1.0, basePoints);
        
        log.debug("💰 Total base points ({}% of ${}): {:.2f}", 
                config.getBaseRate() * 100, totalAmount, basePoints);
        
        // ==================== STEP 2: Add Fixed Bonuses ====================
        // ✅ DYNAMIC: Load bonus values from configuration
        int bonusPoints = 0;
        
        if (totalQuantity >= config.getBonusQuantityThreshold()) {
            bonusPoints += config.getBonusQuantity();
            log.debug("🎁 Quantity bonus ({}+ items): +{} points", 
                    config.getBonusQuantityThreshold(), config.getBonusQuantity());
        }
        
        if (totalAmount > config.getBonusHighOrderThreshold()) {
            bonusPoints += config.getBonusHighOrder();
            log.debug("🎁 Price bonus (>${} order): +{} points", 
                    config.getBonusHighOrderThreshold(), config.getBonusHighOrder());
        }
        
        // ==================== STEP 3: Apply Multiplier ONCE ====================
        // ✅ DYNAMIC: Load multiplier from configuration based on level
        double multiplier = getPointsMultiplierFromConfig(level, config);
        double totalBeforeMultiplier = basePoints + bonusPoints;
        double finalPoints = totalBeforeMultiplier * multiplier;
        
        log.info("🏆 LOYALTY POINTS EARNED - Order: ${} | Base: {:.2f} pts | Bonuses: {} pts | Level: {} ({}x) | FINAL: {} pts", 
                String.format("%.2f", totalAmount),
                basePoints,
                bonusPoints,
                level, 
                multiplier,
                Math.round(finalPoints));
        
        return (int) Math.round(finalPoints);
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
        
        // ✅ DYNAMIC: Load configuration from database
        LoyaltyConfig config = configService.getActiveConfig();
        
        User user = userRepository.findById(userId).orElse(null);
        String level = "BRONZE"; // Default level
        
        if (user != null) {
            LoyaltyCard card = repository.findByUser(user).orElse(null);
            if (card != null) {
                level = card.getLevel();
            }
        }
        
        // Calculate points using dynamic configuration
        double basePoints = Math.max(1.0, amount * config.getBaseRate());
        double multiplier = getPointsMultiplierFromConfig(level, config);
        
        return (int) Math.round(basePoints * multiplier);
    }
    
    public LoyaltyCard getOrCreateLoyaltyCardEntity(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
    }
}
