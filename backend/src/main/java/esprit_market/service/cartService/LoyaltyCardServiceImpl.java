package esprit_market.service.cartService;

import esprit_market.dto.cartDto.ConvertPointsRequest;
import esprit_market.dto.cartDto.LoyaltyCardResponse;
import esprit_market.entity.cart.LoyaltyCard;
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
    
    // ==================== CONSTANTS ====================
    
    // Base formula: points = productPrice * quantity * BASE_POINTS_RATE
    // REALISTIC: 1% of purchase amount (instead of 10%)
    private static final double BASE_POINTS_RATE = 0.01;
    
    // Tier multipliers (more conservative)
    private static final double BRONZE_MULTIPLIER = 1.0;
    private static final double SILVER_MULTIPLIER = 1.1;   // 10% bonus (instead of 20%)
    private static final double GOLD_MULTIPLIER = 1.25;    // 25% bonus (instead of 50%)
    private static final double PLATINUM_MULTIPLIER = 1.5; // 50% bonus (instead of 100%)
    
    // Bonus thresholds (more restrictive)
    private static final int QUANTITY_BONUS_THRESHOLD = 10;     // Need 10+ items (instead of 5)
    private static final double QUANTITY_BONUS_PERCENTAGE = 0.05; // 5% bonus (instead of 10%)
    private static final double PRICE_BONUS_THRESHOLD = 500.0;   // Need $500+ (instead of $200)
    private static final int PRICE_BONUS_FLAT = 5;              // Only 5 points (instead of 20)
    
    // Legacy constants (for backward compatibility)
    private static final int POINTS_PER_CURRENCY_UNIT = 1;      // 1 point per dollar (instead of 10)
    private static final int POINTS_TO_DISCOUNT_RATIO = 100;
    
    // Level thresholds (more realistic)
    private static final int PLATINUM_THRESHOLD = 50000;  // 50k points (instead of 10k)
    private static final int GOLD_THRESHOLD = 20000;      // 20k points (instead of 5k)
    private static final int SILVER_THRESHOLD = 5000;     // 5k points (instead of 1k)

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
        // Step 1: Calculate base points from all items
        double basePoints = 0.0;
        int totalQuantity = 0;
        
        for (OrderItem item : orderItems) {
            if (item.getProductPrice() != null && item.getQuantity() != null) {
                double itemPoints = item.getProductPrice() * item.getQuantity() * BASE_POINTS_RATE;
                basePoints += itemPoints;
                totalQuantity += item.getQuantity();
                
                log.debug("Item: {} x {} @ {} = {} base points", 
                        item.getProductName(), item.getQuantity(), 
                        item.getProductPrice(), itemPoints);
            }
        }
        
        log.debug("Total base points before multiplier: {}", basePoints);
        
        // Step 2: Apply tier multiplier
        double multiplier = getPointsMultiplier(level);
        double pointsAfterMultiplier = basePoints * multiplier;
        
        log.debug("Points after {} multiplier ({}x): {}", level, multiplier, pointsAfterMultiplier);
        
        // Step 3: Apply quantity bonus (if total quantity >= 5)
        double bonusPoints = 0.0;
        if (totalQuantity >= QUANTITY_BONUS_THRESHOLD) {
            bonusPoints += pointsAfterMultiplier * QUANTITY_BONUS_PERCENTAGE;
            log.debug("Quantity bonus applied ({}+ items): +{} points", 
                    QUANTITY_BONUS_THRESHOLD, bonusPoints);
        }
        
        // Step 4: Apply price bonus (if total > 200)
        if (totalAmount > PRICE_BONUS_THRESHOLD) {
            bonusPoints += PRICE_BONUS_FLAT;
            log.debug("Price bonus applied (>${} total): +{} points", 
                    PRICE_BONUS_THRESHOLD, PRICE_BONUS_FLAT);
        }
        
        double totalPoints = pointsAfterMultiplier + bonusPoints;
        int finalPoints = (int) Math.round(totalPoints);
        
        log.info("Final points calculation: base={}, multiplier={}x, bonuses={}, total={}", 
                basePoints, multiplier, bonusPoints, finalPoints);
        
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
        
        if (totalPoints >= PLATINUM_THRESHOLD) {
            return "PLATINUM";
        } else if (totalPoints >= GOLD_THRESHOLD) {
            return "GOLD";
        } else if (totalPoints >= SILVER_THRESHOLD) {
            return "SILVER";
        } else {
            return "BRONZE";
        }
    }
    
    @Override
    public double getPointsMultiplier(String level) {
        if (level == null) return BRONZE_MULTIPLIER;
        
        return switch (level.toUpperCase()) {
            case "PLATINUM" -> PLATINUM_MULTIPLIER;
            case "GOLD" -> GOLD_MULTIPLIER;
            case "SILVER" -> SILVER_MULTIPLIER;
            default -> BRONZE_MULTIPLIER;
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
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return (int) (amount * POINTS_PER_CURRENCY_UNIT * BRONZE_MULTIPLIER);
        }
        
        LoyaltyCard card = repository.findByUser(user).orElse(null);
        String level = (card != null) ? card.getLevel() : "BRONZE";
        double multiplier = getPointsMultiplier(level);
        
        return (int) (amount * POINTS_PER_CURRENCY_UNIT * multiplier);
    }
    
    public LoyaltyCard getOrCreateLoyaltyCardEntity(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
    }
}
