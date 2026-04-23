package esprit_market.service.userService;

import esprit_market.Enum.cartEnum.OrderItemStatus;
import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.Enum.marketplaceEnum.ProductStatus;
import esprit_market.Enum.userEnum.Role;
import esprit_market.Enum.userEnum.TrustBadge;
import esprit_market.entity.cart.Order;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductReview;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ProductReviewRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Trust & Reputation Service
 * 
 * Calculates and manages seller trust scores based on:
 * - Product ratings (40% weight)
 * - Total sales (30% weight)
 * - Product approval rate (20% weight)
 * - Product rejection rate (-10% penalty)
 * 
 * Trust Score Formula:
 * trustScore = (averageRating/5 * 40) + (min(totalSales, 100) * 0.3) + (approvalRate * 20) - (rejectionRate * 10)
 * 
 * Range: 0-100
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TrustService {
    
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final ProductReviewRepository reviewRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    
    // ========================================
    // STARTUP: RECALCULATE ALL TRUST SCORES
    // ========================================
    
    /**
     * Recalculate all trust scores on application startup
     * This ensures existing sellers with approved products get correct scores
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void recalculateAllTrustScoresOnStartup() {
        log.info("🚀 ========================================");
        log.info("🚀 TRUST SYSTEM: Recalculating all trust scores...");
        log.info("🚀 ========================================");
        
        try {
            // Get all shops (sellers)
            List<Shop> allShops = shopRepository.findAll();
            
            if (allShops.isEmpty()) {
                log.info("ℹ️ No shops found. Skipping trust score recalculation.");
                return;
            }
            
            log.info("📊 Found {} shops to process", allShops.size());
            
            int updated = 0;
            int skipped = 0;
            
            for (Shop shop : allShops) {
                try {
                    if (shop.getOwnerId() == null) {
                        log.warn("⚠️ Shop {} has no owner, skipping", shop.getName());
                        skipped++;
                        continue;
                    }
                    
                    // Check if user exists
                    User seller = userRepository.findById(shop.getOwnerId()).orElse(null);
                    if (seller == null) {
                        log.warn("⚠️ Owner not found for shop {}, skipping", shop.getName());
                        skipped++;
                        continue;
                    }
                    
                    double oldScore = seller.getTrustScore();
                    
                    // Recalculate trust score
                    updateSellerTrustScore(shop.getOwnerId());
                    
                    // Reload to get updated score
                    seller = userRepository.findById(shop.getOwnerId()).orElse(seller);
                    double newScore = seller.getTrustScore();
                    
                    if (oldScore != newScore) {
                        log.info("✅ Updated {} ({}): {} → {}", 
                                seller.getEmail(), shop.getName(), oldScore, newScore);
                        updated++;
                    } else {
                        skipped++;
                    }
                    
                } catch (Exception e) {
                    log.error("❌ Error processing shop {}: {}", shop.getName(), e.getMessage());
                    skipped++;
                }
            }
            
            log.info("🚀 ========================================");
            log.info("🚀 TRUST SYSTEM: Recalculation complete!");
            log.info("🚀 Updated: {} | Skipped: {} | Total: {}", updated, skipped, allShops.size());
            log.info("🚀 ========================================");
            
        } catch (Exception e) {
            log.error("❌ Failed to recalculate trust scores on startup: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Manually recalculate all trust scores (for admin endpoint)
     */
    @Transactional
    public void recalculateAllTrustScores() {
        log.info("🔄 Manual recalculation of all trust scores triggered");
        recalculateAllTrustScoresOnStartup();
    }
    
    // ========================================
    // TRUST SCORE CALCULATION
    // ========================================
    
    /**
     * Calculate trust score for a seller
     * 
     * @param sellerId Seller's user ID
     * @return Calculated trust score (0-100)
     */
    public double calculateTrustScore(ObjectId sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
        
        // Get seller's shop
        Shop shop = shopRepository.findByOwnerId(sellerId)
                .orElse(null);
        
        if (shop == null) {
            log.warn("No shop found for seller {}, returning 0 trust score", sellerId);
            return 0.0;
        }
        
        // Get product statistics
        List<Product> products = productRepository.findByShopId(shop.getId());
        
        if (products.isEmpty()) {
            log.info("No products found for seller {}, returning 0 trust score", sellerId);
            return 0.0;
        }
        
        long approvedCount = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .count();
        long rejectedCount = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.REJECTED)
                .count();
        
        // ✅ SIMPLIFIED FORMULA: Works immediately with approvals/rejections
        // Base score from approvals: +10 points per approved product (max 40 points)
        double approvalScore = Math.min(approvedCount * 10, 40);
        
        // Penalty from rejections: -5 points per rejected product
        double rejectionPenalty = rejectedCount * 5;
        
        // 1. Calculate average rating component (40% weight) - if reviews exist
        double ratingComponent = calculateRatingComponent(sellerId);
        
        // 2. Calculate sales component (30% weight) - if sales exist
        double salesComponent = calculateSalesComponent(shop.getId());
        
        // 3. Calculate approval rate component (20% weight)
        double approvalComponent = calculateApprovalComponent(shop.getId());
        
        // 4. Calculate rejection penalty (10% weight)
        double rejectionRateComponent = calculateRejectionPenalty(shop.getId());
        
        // If no reviews and no sales, use simplified formula
        if (ratingComponent == 0 && salesComponent == 0) {
            // Simplified: approval score - rejection penalty
            double trustScore = approvalScore - rejectionPenalty;
            trustScore = Math.max(0, Math.min(100, trustScore));
            
            log.info("Trust score (simplified) for seller {}: {} (approved: {}, rejected: {})",
                    sellerId, trustScore, approvedCount, rejectedCount);
            
            return trustScore;
        }
        
        // Full formula when reviews/sales exist
        double trustScore = ratingComponent + salesComponent + approvalComponent - rejectionRateComponent;
        
        // Ensure score is within 0-100 range
        trustScore = Math.max(0, Math.min(100, trustScore));
        
        log.info("Trust score (full) calculated for seller {}: {} (rating: {}, sales: {}, approval: {}, rejection: {})",
                sellerId, trustScore, ratingComponent, salesComponent, approvalComponent, rejectionRateComponent);
        
        return trustScore;
    }
    
    /**
     * Calculate rating component (40% weight)
     * Based on average product ratings (1-5 stars)
     */
    private double calculateRatingComponent(ObjectId sellerId) {
        List<ProductReview> reviews = reviewRepository.findBySellerId(sellerId);
        
        if (reviews.isEmpty()) {
            return 0.0; // No reviews yet
        }
        
        // Calculate average rating
        double avgRating = reviews.stream()
                .filter(ProductReview::isApproved)
                .mapToInt(ProductReview::getRating)
                .average()
                .orElse(0.0);
        
        // Normalize to 40 points max (5 stars = 40 points)
        return (avgRating / 5.0) * 40.0;
    }
    
    /**
     * Calculate sales component (30% weight)
     * Based on total completed sales (PAID orders)
     */
    private double calculateSalesComponent(ObjectId shopId) {
        // Get all order items for this shop
        List<OrderItem> shopOrderItems = orderItemRepository.findByShopId(shopId);
        
        // Filter for ACTIVE items (not cancelled/refunded) from PAID orders
        List<OrderItem> completedSales = shopOrderItems.stream()
                .filter(item -> item.getStatus() == OrderItemStatus.ACTIVE)
                .filter(item -> {
                    // Check if the order is PAID
                    if (item.getOrderId() != null) {
                        return orderRepository.findById(item.getOrderId())
                                .map(order -> order.getStatus() == OrderStatus.PAID)
                                .orElse(false);
                    }
                    return false;
                })
                .collect(Collectors.toList());
        
        int totalSales = completedSales.size();
        
        // Cap at 100 sales for scoring (100 sales = 30 points)
        // This prevents established sellers from having unbeatable scores
        int cappedSales = Math.min(totalSales, 100);
        
        return cappedSales * 0.3;
    }
    
    /**
     * Calculate approval rate component (20% weight)
     * Based on percentage of approved products
     */
    private double calculateApprovalComponent(ObjectId shopId) {
        List<Product> allProducts = productRepository.findByShopId(shopId);
        
        if (allProducts.isEmpty()) {
            return 0.0; // No products yet
        }
        
        long approvedCount = allProducts.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .count();
        
        double approvalRate = (double) approvedCount / allProducts.size();
        
        // Normalize to 20 points max (100% approval = 20 points)
        return approvalRate * 20.0;
    }
    
    /**
     * Calculate rejection penalty (-10% weight)
     * Based on percentage of rejected products
     */
    private double calculateRejectionPenalty(ObjectId shopId) {
        List<Product> allProducts = productRepository.findByShopId(shopId);
        
        if (allProducts.isEmpty()) {
            return 0.0; // No products yet
        }
        
        long rejectedCount = allProducts.stream()
                .filter(p -> p.getStatus() == ProductStatus.REJECTED)
                .count();
        
        double rejectionRate = (double) rejectedCount / allProducts.size();
        
        // Normalize to 10 points penalty (100% rejection = -10 points)
        return rejectionRate * 10.0;
    }
    
    // ========================================
    // TRUST SCORE UPDATE TRIGGERS
    // ========================================
    
    /**
     * Update seller's trust score and statistics
     * Called after any event that affects trust
     */
    @Transactional
    public void updateSellerTrustScore(ObjectId sellerId) {
        log.info("📊 Starting trust score update for seller: {}", sellerId);
        
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
        
        Shop shop = shopRepository.findByOwnerId(sellerId)
                .orElse(null);
        
        if (shop == null) {
            log.warn("⚠️ No shop found for seller {}, skipping trust update", sellerId);
            return;
        }
        
        // Update seller statistics
        updateSellerStatistics(seller, shop);
        
        // Calculate new trust score
        double oldTrustScore = seller.getTrustScore();
        double newTrustScore = calculateTrustScore(sellerId);
        seller.setTrustScore(newTrustScore);
        
        // Save seller
        userRepository.save(seller);
        
        // Update shop trust score and badge
        shop.setTrustScore(newTrustScore);
        shop.setTrustBadge(getTrustBadge(newTrustScore).name());
        shopRepository.save(shop);
        
        log.info("✅ Trust score updated for seller {}: {} → {} (badge: {})", 
                sellerId, oldTrustScore, newTrustScore, shop.getTrustBadge());
        log.info("📈 Stats - Approved: {}, Rejected: {}, Sales: {}, Rating: {}", 
                seller.getApprovedProducts(), seller.getRejectedProducts(), 
                seller.getTotalSales(), seller.getAverageRating());
    }
    
    /**
     * Update seller's statistics (sales, ratings, approvals, rejections)
     */
    private void updateSellerStatistics(User seller, Shop shop) {
        // Update total sales (ACTIVE items from PAID orders)
        List<OrderItem> shopOrderItems = orderItemRepository.findByShopId(shop.getId());
        
        long totalSales = shopOrderItems.stream()
                .filter(item -> item.getStatus() == OrderItemStatus.ACTIVE)
                .filter(item -> {
                    if (item.getOrderId() != null) {
                        return orderRepository.findById(item.getOrderId())
                                .map(order -> order.getStatus() == OrderStatus.PAID)
                                .orElse(false);
                    }
                    return false;
                })
                .count();
        
        seller.setTotalSales((int) totalSales);
        
        // Update product approval/rejection counts
        List<Product> products = productRepository.findByShopId(shop.getId());
        long approvedCount = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                .count();
        long rejectedCount = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.REJECTED)
                .count();
        
        seller.setApprovedProducts((int) approvedCount);
        seller.setRejectedProducts((int) rejectedCount);
        
        // Update average rating
        List<ProductReview> reviews = reviewRepository.findBySellerId(seller.getId());
        if (!reviews.isEmpty()) {
            double avgRating = reviews.stream()
                    .filter(ProductReview::isApproved)
                    .mapToInt(ProductReview::getRating)
                    .average()
                    .orElse(0.0);
            seller.setAverageRating(avgRating);
            seller.setTotalRatings(reviews.size());
        }
    }
    
    // ========================================
    // BADGE MANAGEMENT
    // ========================================
    
    /**
     * Get trust badge based on score
     * 
     * @param trustScore Trust score (0-100)
     * @return Trust badge enum
     */
    public TrustBadge getTrustBadge(double trustScore) {
        return TrustBadge.fromScore(trustScore);
    }
    
    /**
     * Get badge display name
     */
    public String getBadgeDisplayName(double trustScore) {
        return getTrustBadge(trustScore).getDisplayName();
    }
    
    /**
     * Get badge color
     */
    public String getBadgeColor(double trustScore) {
        return getTrustBadge(trustScore).getColor();
    }
    
    // ========================================
    // EVENT HANDLERS (Called by other services)
    // ========================================
    
    /**
     * Handle product approval event
     */
    public void onProductApproved(ObjectId productId) {
        log.info("🟢 Product approved event triggered for product: {}", productId);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        Shop shop = shopRepository.findById(product.getShopId())
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        
        log.info("🟢 Updating trust score for seller: {} (shop: {})", shop.getOwnerId(), shop.getName());
        
        updateSellerTrustScore(shop.getOwnerId());
    }
    
    /**
     * Handle product rejection event
     */
    public void onProductRejected(ObjectId productId) {
        log.info("🔴 Product rejected event triggered for product: {}", productId);
        
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        Shop shop = shopRepository.findById(product.getShopId())
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        
        log.info("🔴 Updating trust score for seller: {} (shop: {})", shop.getOwnerId(), shop.getName());
        
        updateSellerTrustScore(shop.getOwnerId());
    }
    
    /**
     * Handle order payment event (order becomes PAID)
     * This is when a sale is considered complete
     */
    public void onOrderPaid(ObjectId orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        
        // Get all order items for this order
        List<OrderItem> orderItems = orderItemRepository.findByOrderId(orderId);
        
        // Update trust score for each shop involved
        orderItems.stream()
                .map(OrderItem::getShopId)
                .distinct()
                .forEach(shopId -> {
                    Shop shop = shopRepository.findById(shopId)
                            .orElse(null);
                    if (shop != null) {
                        updateSellerTrustScore(shop.getOwnerId());
                    }
                });
    }
    
    /**
     * Handle product review event
     */
    public void onProductReviewed(ObjectId reviewId) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        
        updateSellerTrustScore(review.getSellerId());
    }
}
