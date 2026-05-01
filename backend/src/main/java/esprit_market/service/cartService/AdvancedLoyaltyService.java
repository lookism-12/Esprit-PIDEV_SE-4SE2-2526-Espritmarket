package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.Enum.cartEnum.RewardStatus;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.cartDto.*;
import esprit_market.entity.cart.*;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.*;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Advanced Dynamic Loyalty Service
 * 
 * Features:
 * 1. Dynamic baseRate adjustment based on user activity
 * 2. Points to rewards conversion (coupons/discounts)
 * 3. Shop restriction (rewards only in top 3 shops)
 * 4. Reward validation and usage tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdvancedLoyaltyService {
    
    private final LoyaltyCardRepository loyaltyCardRepository;
    private final LoyaltyRewardRepository loyaltyRewardRepository;
    private final UserRewardRepository userRewardRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ILoyaltyConfigService configService;
    private final MongoTemplate mongoTemplate;
    
    // ==================== DYNAMIC LOYALTY CALCULATION ====================
    
    /**
     * Calculate dynamic boost based on user activity
     * 
     * Rules:
     * - < 3 orders/month → no boost (0.0)
     * - 3-10 orders/month → +0.1 boost
     * - > 10 orders/month → +0.2 boost
     */
    public double calculateDynamicBoost(ObjectId userId) {
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        
        long orderCount = orderRepository.countByUserIdAndCreatedAtAfterAndStatusNot(
            userId, oneMonthAgo, OrderStatus.CANCELLED
        );
        
        if (orderCount >= 10) {
            log.debug("User {} has {} orders this month - HIGH activity boost: +0.2", userId, orderCount);
            return 0.2;
        } else if (orderCount >= 3) {
            log.debug("User {} has {} orders this month - MEDIUM activity boost: +0.1", userId, orderCount);
            return 0.1;
        } else {
            log.debug("User {} has {} orders this month - NO boost", userId, orderCount);
            return 0.0;
        }
    }
    
    /**
     * Get effective base rate (admin config + dynamic boost)
     */
    public double getEffectiveBaseRate(ObjectId userId) {
        LoyaltyConfig config = configService.getActiveConfig();
        double adminBaseRate = config.getBaseRate() != null ? config.getBaseRate() : 1.0;
        double dynamicBoost = calculateDynamicBoost(userId);
        
        double effectiveRate = adminBaseRate + dynamicBoost;
        log.info("💎 Effective base rate for user {}: {} (admin: {} + boost: {})", 
                userId, effectiveRate, adminBaseRate, dynamicBoost);
        
        return effectiveRate;
    }
    
    // ==================== TOP SHOPS CALCULATION ====================
    
    /**
     * Calculate user's top 3 shops based on order activity in last 30 days
     */
    public List<ShopSummaryDTO> getTopShops(ObjectId userId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        log.info("🔍 Calculating top shops for user {} (last 30 days)", userId);
        
        try {
            // Get all orders from this user in last 30 days
            List<Order> recentOrders = orderRepository.findByUserIdAndCreatedAtAfterAndStatusNot(
                userId, thirtyDaysAgo, OrderStatus.CANCELLED
            );
            
            log.info("📦 Found {} recent orders for user {}", recentOrders.size(), userId);
            
            if (recentOrders.isEmpty()) {
                log.warn("⚠️ No recent orders found for user {}", userId);
                return Collections.emptyList();
            }
            
            // Get all order items for these orders
            List<ObjectId> orderIds = recentOrders.stream()
                .map(Order::getId)
                .collect(Collectors.toList());
            
            List<OrderItem> orderItems = orderItemRepository.findByOrderIdIn(orderIds);
            log.info("📋 Found {} order items across {} orders", orderItems.size(), orderIds.size());
            
            // Group by shopId and calculate stats
            Map<ObjectId, ShopStats> shopStatsMap = new HashMap<>();
            
            for (OrderItem item : orderItems) {
                if (item.getShopId() == null) {
                    log.warn("⚠️ OrderItem {} has null shopId, skipping", item.getId());
                    continue;
                }
                
                ShopStats stats = shopStatsMap.computeIfAbsent(
                    item.getShopId(), 
                    k -> new ShopStats()
                );
                
                stats.orderCount++;
                stats.totalSpent += (item.getSubtotal() != null ? item.getSubtotal() : 0.0);
            }
            
            log.info("🏪 Found {} unique shops", shopStatsMap.size());
            
            // Sort by order count and take top 3
            List<ShopSummaryDTO> topShops = shopStatsMap.entrySet().stream()
                .sorted((e1, e2) -> Integer.compare(e2.getValue().orderCount, e1.getValue().orderCount))
                .limit(3)
                .map(entry -> {
                    ObjectId shopId = entry.getKey();
                    ShopStats stats = entry.getValue();
                    
                    // Try to get shop name from Shop collection
                    String shopName = getShopName(shopId);
                    
                    return ShopSummaryDTO.builder()
                        .shopId(shopId.toHexString())
                        .shopName(shopName)
                        .orderCount(stats.orderCount)
                        .totalSpent(stats.totalSpent)
                        .build();
                })
                .collect(Collectors.toList());
            
            log.info("✅ Top {} shops for user {}: {}", 
                topShops.size(), userId, 
                topShops.stream()
                    .map(s -> s.getShopName() + " (" + s.getOrderCount() + " orders)")
                    .collect(Collectors.toList()));
            
            return topShops;
            
        } catch (Exception e) {
            log.error("❌ Error calculating top shops for user {}: {}", userId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }
    
    /**
     * Helper class for shop statistics
     */
    private static class ShopStats {
        int orderCount = 0;
        double totalSpent = 0.0;
    }
    
    /**
     * Get shop name from Shop collection
     */
    private String getShopName(ObjectId shopId) {
        try {
            // Try to find shop in database
            Map<String, Object> shop = mongoTemplate.findById(shopId, Map.class, "shops");
            if (shop != null && shop.containsKey("name")) {
                return (String) shop.get("name");
            }
        } catch (Exception e) {
            log.debug("Could not fetch shop name for {}: {}", shopId, e.getMessage());
        }
        
        // Fallback to ID-based name
        return "Shop " + shopId.toHexString().substring(0, 8);
    }
    
    // ==================== REWARD MANAGEMENT ====================
    
    /**
     * Get all available rewards (admin-configured)
     */
    public List<LoyaltyRewardDTO> getAvailableRewards() {
        List<LoyaltyReward> rewards = loyaltyRewardRepository.findByActiveTrueOrderByPointsRequiredAsc();
        return rewards.stream()
            .map(this::toRewardDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Get rewards user can afford
     */
    public List<LoyaltyRewardDTO> getAffordableRewards(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        LoyaltyCard card = loyaltyCardRepository.findByUser(user).orElse(null);
        if (card == null) {
            return Collections.emptyList();
        }
        
        int availablePoints = card.getPoints() != null ? card.getPoints() : 0;
        
        List<LoyaltyReward> rewards = loyaltyRewardRepository
            .findByActiveTrueAndPointsRequiredLessThanEqualOrderByPointsRequiredAsc(availablePoints);
        
        return rewards.stream()
            .map(this::toRewardDTO)
            .collect(Collectors.toList());
    }
    
    /**
     * Convert points to reward
     */
    @Transactional
    public UserRewardDTO convertPointsToReward(ObjectId userId, String rewardId) {
        // Validate user
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Validate reward
        LoyaltyReward reward = loyaltyRewardRepository.findById(new ObjectId(rewardId))
            .orElseThrow(() -> new ResourceNotFoundException("Reward not found"));
        
        if (!reward.getActive()) {
            throw new IllegalArgumentException("This reward is no longer available");
        }
        
        // Validate user has enough points
        LoyaltyCard card = loyaltyCardRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Loyalty card not found"));
        
        int availablePoints = card.getPoints() != null ? card.getPoints() : 0;
        if (availablePoints < reward.getPointsRequired()) {
            throw new IllegalArgumentException(
                String.format("Insufficient points. Required: %d, Available: %d", 
                    reward.getPointsRequired(), availablePoints)
            );
        }
        
        // Deduct points
        card.setPoints(availablePoints - reward.getPointsRequired());
        loyaltyCardRepository.save(card);
        
        // Get top shops for restriction
        List<ShopSummaryDTO> topShops = getTopShops(userId);
        List<ObjectId> allowedShopIds = topShops.stream()
            .map(shop -> new ObjectId(shop.getShopId()))
            .collect(Collectors.toList());
        
        // Generate unique coupon code
        String couponCode = generateCouponCode();
        
        // Create user reward
        UserReward userReward = UserReward.builder()
            .user(user)
            .rewardId(reward.getId())
            .rewardName(reward.getName())
            .rewardValue(reward.getRewardValue())
            .maxDiscountAmount(reward.getMaxDiscountAmount())
            .minOrderAmount(reward.getMinOrderAmount())
            .pointsSpent(reward.getPointsRequired())
            .status(RewardStatus.ACTIVE)
            .couponCode(couponCode)
            .allowedShopIds(allowedShopIds)
            .expiresAt(LocalDateTime.now().plusDays(reward.getValidityDays()))
            .createdAt(LocalDateTime.now())
            .build();
        
        UserReward saved = userRewardRepository.save(userReward);
        
        log.info("✅ User {} converted {} points to reward '{}' (coupon: {})", 
                userId, reward.getPointsRequired(), reward.getName(), couponCode);
        
        return toUserRewardDTO(saved, topShops);
    }
    
    /**
     * Get user's active rewards
     */
    public List<UserRewardDTO> getUserActiveRewards(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        List<UserReward> rewards = userRewardRepository.findByUserAndStatusOrderByCreatedAtDesc(
            user, RewardStatus.ACTIVE
        );
        
        List<ShopSummaryDTO> topShops = getTopShops(userId);
        
        return rewards.stream()
            .map(reward -> toUserRewardDTO(reward, topShops))
            .collect(Collectors.toList());
    }
    
    /**
     * Validate reward for checkout
     */
    public UserReward validateRewardForCheckout(String couponCode, ObjectId shopId, Double orderAmount) {
        UserReward reward = userRewardRepository.findByCouponCode(couponCode)
            .orElseThrow(() -> new ResourceNotFoundException("Invalid coupon code"));
        
        // Check status
        if (reward.getStatus() != RewardStatus.ACTIVE) {
            throw new IllegalArgumentException("This reward has already been used or expired");
        }
        
        // Check expiry
        if (reward.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("This reward has expired");
        }
        
        // Check shop restriction
        if (reward.getAllowedShopIds() != null && !reward.getAllowedShopIds().isEmpty()) {
            if (!reward.getAllowedShopIds().contains(shopId)) {
                throw new IllegalArgumentException(
                    "This reward can only be used in your top 3 most-shopped stores"
                );
            }
        }
        
        // Check minimum order amount
        if (reward.getMinOrderAmount() != null && orderAmount < reward.getMinOrderAmount()) {
            throw new IllegalArgumentException(
                String.format("Minimum order amount is %.2f TND", reward.getMinOrderAmount())
            );
        }
        
        return reward;
    }
    
    /**
     * Calculate discount from reward
     */
    public double calculateRewardDiscount(UserReward reward, Double orderAmount) {
        double discount = 0.0;
        
        // Get reward type from original reward
        LoyaltyReward originalReward = loyaltyRewardRepository.findById(reward.getRewardId())
            .orElse(null);
        
        if (originalReward != null) {
            if (originalReward.getRewardType() == esprit_market.Enum.cartEnum.RewardType.PERCENTAGE_DISCOUNT) {
                // Percentage discount
                discount = orderAmount * (reward.getRewardValue() / 100.0);
            } else {
                // Fixed amount
                discount = reward.getRewardValue();
            }
            
            // Apply max discount cap
            if (reward.getMaxDiscountAmount() != null) {
                discount = Math.min(discount, reward.getMaxDiscountAmount());
            }
        }
        
        // Ensure discount doesn't exceed order amount
        discount = Math.min(discount, orderAmount);
        
        log.info("💰 Calculated discount: {} TND for order {} TND (reward: {})", 
                String.format("%.2f", discount), 
                String.format("%.2f", orderAmount), 
                reward.getCouponCode());
        
        return discount;
    }
    
    /**
     * Mark reward as used
     */
    @Transactional
    public void markRewardAsUsed(String couponCode, ObjectId orderId, Double discountApplied) {
        UserReward reward = userRewardRepository.findByCouponCode(couponCode)
            .orElseThrow(() -> new ResourceNotFoundException("Reward not found"));
        
        reward.setStatus(RewardStatus.USED);
        reward.setUsedAt(LocalDateTime.now());
        reward.setUsedInOrderId(orderId);
        reward.setActualDiscountApplied(discountApplied);
        
        userRewardRepository.save(reward);
        
        log.info("✅ Reward {} marked as used in order {}", couponCode, orderId);
    }
    
    // ==================== LOYALTY DASHBOARD ====================
    
    /**
     * Get complete loyalty dashboard data
     */
    public LoyaltyDashboardDTO getLoyaltyDashboard(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Get loyalty card
        LoyaltyCard card = loyaltyCardRepository.findByUser(user).orElse(null);
        
        // Get dynamic boost
        double dynamicBoost = calculateDynamicBoost(userId);
        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        long ordersThisMonth = orderRepository.countByUserIdAndCreatedAtAfterAndStatusNot(
            userId, oneMonthAgo, OrderStatus.CANCELLED
        );
        
        String boostTier = ordersThisMonth >= 10 ? "HIGH" : ordersThisMonth >= 3 ? "MEDIUM" : "NONE";
        
        // Get available rewards
        List<LoyaltyRewardDTO> availableRewards = getAffordableRewards(userId);
        
        // Get active rewards
        List<UserRewardDTO> activeRewards = getUserActiveRewards(userId);
        
        // Get top shops
        List<ShopSummaryDTO> topShops = getTopShops(userId);
        
        // Calculate points to next reward
        int currentPoints = card != null && card.getPoints() != null ? card.getPoints() : 0;
        List<LoyaltyReward> allRewards = loyaltyRewardRepository.findByActiveTrueOrderByPointsRequiredAsc();
        
        Integer pointsToNext = null;
        String nextRewardName = null;
        for (LoyaltyReward reward : allRewards) {
            if (reward.getPointsRequired() > currentPoints) {
                pointsToNext = reward.getPointsRequired() - currentPoints;
                nextRewardName = reward.getName();
                break;
            }
        }
        
        return LoyaltyDashboardDTO.builder()
            .totalPoints(card != null ? card.getPoints() : 0)
            .totalPointsEarned(card != null ? card.getTotalPointsEarned() : 0)
            .loyaltyLevel(card != null ? card.getLevel() : "BRONZE")
            .currentMultiplier(card != null ? getCurrentMultiplier(card.getLevel()) : 1.0)
            .ordersThisMonth((int) ordersThisMonth)
            .dynamicBoost(dynamicBoost)
            .boostTier(boostTier)
            .availableRewards(availableRewards)
            .activeRewards(activeRewards)
            .topShops(topShops)
            .pointsToNextReward(pointsToNext)
            .nextRewardName(nextRewardName)
            .build();
    }
    
    // ==================== HELPER METHODS ====================
    
    private double getCurrentMultiplier(String level) {
        LoyaltyConfig config = configService.getActiveConfig();
        return switch (level.toUpperCase()) {
            case "PLATINUM" -> config.getPlatinumMultiplier();
            case "GOLD" -> config.getGoldMultiplier();
            case "SILVER" -> config.getSilverMultiplier();
            default -> config.getBronzeMultiplier();
        };
    }
    
    private String generateCouponCode() {
        return "LOYALTY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    
    private LoyaltyRewardDTO toRewardDTO(LoyaltyReward reward) {
        return LoyaltyRewardDTO.builder()
            .id(reward.getId().toHexString())
            .name(reward.getName())
            .description(reward.getDescription())
            .pointsRequired(reward.getPointsRequired())
            .rewardType(reward.getRewardType())
            .rewardValue(reward.getRewardValue())
            .maxDiscountAmount(reward.getMaxDiscountAmount())
            .minOrderAmount(reward.getMinOrderAmount())
            .validityDays(reward.getValidityDays())
            .active(reward.getActive())
            .displayOrder(reward.getDisplayOrder())
            .createdAt(reward.getCreatedAt())
            .updatedAt(reward.getUpdatedAt())
            .createdBy(reward.getCreatedBy())
            .build();
    }
    
    private UserRewardDTO toUserRewardDTO(UserReward reward, List<ShopSummaryDTO> topShops) {
        LocalDateTime now = LocalDateTime.now();
        boolean isExpired = reward.getExpiresAt().isBefore(now);
        boolean canUse = reward.getStatus() == RewardStatus.ACTIVE && !isExpired;
        long daysUntilExpiry = ChronoUnit.DAYS.between(now, reward.getExpiresAt());
        
        return UserRewardDTO.builder()
            .id(reward.getId().toHexString())
            .userId(reward.getUser().getId().toHexString())
            .rewardId(reward.getRewardId().toHexString())
            .rewardName(reward.getRewardName())
            .rewardValue(reward.getRewardValue())
            .maxDiscountAmount(reward.getMaxDiscountAmount())
            .minOrderAmount(reward.getMinOrderAmount())
            .pointsSpent(reward.getPointsSpent())
            .status(reward.getStatus())
            .couponCode(reward.getCouponCode())
            .allowedShopIds(reward.getAllowedShopIds() != null ? 
                reward.getAllowedShopIds().stream().map(ObjectId::toHexString).collect(Collectors.toList()) : null)
            .allowedShops(topShops)
            .expiresAt(reward.getExpiresAt())
            .usedAt(reward.getUsedAt())
            .usedInOrderId(reward.getUsedInOrderId() != null ? reward.getUsedInOrderId().toHexString() : null)
            .actualDiscountApplied(reward.getActualDiscountApplied())
            .createdAt(reward.getCreatedAt())
            .cancelledAt(reward.getCancelledAt())
            .isExpired(isExpired)
            .canUse(canUse)
            .daysUntilExpiry(daysUntilExpiry)
            .build();
    }
}
