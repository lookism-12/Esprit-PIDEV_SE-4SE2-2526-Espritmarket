package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.cart.Cart;
import esprit_market.entity.cart.CartItem;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.CartItemRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Scheduled service for cart expiration management.
 * 
 * Timeline:
 *   0h    → User adds product to cart
 *   24h   → 🔔 Notification: "You have 24 hours left before your cart expires"
 *   47.5h → 🚨 Urgent notification: "Your cart will expire very soon!"
 *   48h   → ❌ Cart items are automatically deleted
 * 
 * The timer resets when user modifies the cart (add/update/remove items).
 * lastUpdated field on Cart is used as the reference timestamp.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CartExpirationService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final INotificationService notificationService;

    // ==================== CONFIGURATION CONSTANTS ====================
    
    /** Cart expires 48 hours after last activity */
    private static final long EXPIRATION_HOURS = 48;
    
    /** First warning notification after 24 hours of inactivity */
    private static final long WARNING_HOURS = 24;
    
    /** Urgent notification 30 minutes before expiration (47.5 hours) */
    private static final double URGENT_HOURS = 47.5;

    // ==================== SCHEDULED JOBS ====================

    /**
     * Job 1: Send 24h warning notifications.
     * Runs every 30 minutes to check for carts that have been inactive for 24+ hours.
     */
    @Scheduled(fixedRate = 1800000) // Every 30 minutes
    @Transactional
    public void sendExpirationWarnings() {
        log.debug("⏰ Running cart expiration warning check...");
        
        LocalDateTime warningThreshold = LocalDateTime.now().minusHours(WARNING_HOURS);
        
        List<Cart> cartsToWarn = cartRepository
                .findByStatusAndLastUpdatedBeforeAndNotification24hSent(
                        CartStatus.DRAFT, warningThreshold, false);
        
        if (cartsToWarn.isEmpty()) {
            return;
        }
        
        log.info("🔔 Found {} carts needing 24h expiration warning", cartsToWarn.size());
        
        for (Cart cart : cartsToWarn) {
            try {
                sendWarningNotification(cart);
                cart.setNotification24hSent(true);
                cartRepository.save(cart);
            } catch (Exception e) {
                log.error("❌ Failed to send 24h warning for cart {}: {}", 
                        cart.getId(), e.getMessage());
            }
        }
    }

    /**
     * Job 2: Send urgent notifications (47.5 hours — 30 minutes before expiration).
     * Runs every 10 minutes for more precise timing near expiration.
     */
    @Scheduled(fixedRate = 600000) // Every 10 minutes
    @Transactional
    public void sendUrgentExpirationAlerts() {
        log.debug("⏰ Running cart urgent expiration check...");
        
        // 47.5 hours = 47 hours + 30 minutes
        LocalDateTime urgentThreshold = LocalDateTime.now()
                .minusHours(47).minusMinutes(30);
        
        List<Cart> cartsToAlert = cartRepository
                .findByStatusAndLastUpdatedBeforeAndNotification47hSent(
                        CartStatus.DRAFT, urgentThreshold, false);
        
        if (cartsToAlert.isEmpty()) {
            return;
        }
        
        log.info("🚨 Found {} carts needing urgent expiration alert", cartsToAlert.size());
        
        for (Cart cart : cartsToAlert) {
            try {
                sendUrgentNotification(cart);
                cart.setNotification47hSent(true);
                cartRepository.save(cart);
            } catch (Exception e) {
                log.error("❌ Failed to send urgent alert for cart {}: {}", 
                        cart.getId(), e.getMessage());
            }
        }
    }

    /**
     * Job 3: Delete expired carts (48+ hours of inactivity).
     * Runs every 30 minutes.
     */
    @Scheduled(fixedRate = 1800000) // Every 30 minutes
    @Transactional
    public void cleanupExpiredCarts() {
        log.debug("⏰ Running expired cart cleanup...");
        
        LocalDateTime expirationThreshold = LocalDateTime.now().minusHours(EXPIRATION_HOURS);
        
        List<Cart> expiredCarts = cartRepository.findByStatusAndLastUpdatedBefore(
                CartStatus.DRAFT, expirationThreshold);
        
        if (expiredCarts.isEmpty()) {
            return;
        }
        
        log.info("❌ Found {} expired carts to clean up", expiredCarts.size());
        
        for (Cart cart : expiredCarts) {
            try {
                deleteExpiredCart(cart);
            } catch (Exception e) {
                log.error("❌ Failed to clean up expired cart {}: {}", 
                        cart.getId(), e.getMessage());
            }
        }
    }

    // ==================== LOGIN CHECK ====================

    /**
     * Check if user's cart has an expiration warning.
     * Called when user logs in to show alert popup.
     * 
     * @param userId The user's ObjectId
     * @return Map with warning info, or null if no warning needed
     */
    public Map<String, Object> checkCartExpirationWarning(ObjectId userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return null;
        
        List<Cart> draftCarts = cartRepository.findAllByUserAndStatus(user, CartStatus.DRAFT);
        if (draftCarts.isEmpty()) return null;
        
        Cart cart = draftCarts.get(0);
        
        // Check if cart has items
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        if (items.isEmpty()) return null;
        
        LocalDateTime lastUpdated = cart.getLastUpdated();
        if (lastUpdated == null) return null;
        
        Duration timeSinceUpdate = Duration.between(lastUpdated, LocalDateTime.now());
        long hoursElapsed = timeSinceUpdate.toHours();
        long remainingHours = EXPIRATION_HOURS - hoursElapsed;
        long remainingMinutes = (EXPIRATION_HOURS * 60) - timeSinceUpdate.toMinutes();
        
        // Only warn if less than 24 hours remaining
        if (remainingHours > WARNING_HOURS) {
            return null;
        }
        
        Map<String, Object> warning = new LinkedHashMap<>();
        warning.put("hasWarning", true);
        warning.put("remainingHours", Math.max(0, remainingHours));
        warning.put("remainingMinutes", Math.max(0, remainingMinutes));
        warning.put("itemCount", items.size());
        warning.put("cartTotal", cart.getTotal());
        
        if (remainingMinutes <= 30) {
            warning.put("severity", "CRITICAL");
            warning.put("message", "🚨 Your cart will expire in less than 30 minutes! Complete checkout now.");
        } else if (remainingHours <= 1) {
            warning.put("severity", "URGENT");
            warning.put("message", "⚠️ Your cart will expire in about " + remainingMinutes + " minutes!");
        } else {
            warning.put("severity", "WARNING");
            warning.put("message", "⏰ Your cart will expire in " + remainingHours + " hours. Complete checkout soon.");
        }
        
        return warning;
    }

    // ==================== TIMER RESET ====================

    /**
     * Reset expiration timer when user modifies the cart.
     * Called from CartServiceImpl when items are added/updated/removed.
     * 
     * @param cart The cart to reset timers for
     */
    public void resetExpirationTimer(Cart cart) {
        if (cart == null) return;
        
        cart.setNotification24hSent(false);
        cart.setNotification47hSent(false);
        // lastUpdated is already set by the caller (CartServiceImpl)
        
        log.debug("🔄 Cart expiration timer reset for cart {}", cart.getId());
    }

    // ==================== PRIVATE HELPERS ====================

    private void sendWarningNotification(Cart cart) {
        ObjectId userId = cart.getUserId();
        if (userId == null) return;
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        int itemCount = items.size();
        
        String title = "⏰ Your cart will expire soon";
        String description = String.format(
                "You have %d item(s) in your cart worth %.2f TND. " +
                "Your cart will be cleared in 24 hours if you don't complete checkout.",
                itemCount, cart.getTotal() != null ? cart.getTotal() : 0.0);
        
        notificationService.sendNotification(user, title, description,
                NotificationType.CART_EXPIRATION_WARNING, cart.getId().toHexString());
        
        log.info("🔔 Sent 24h cart expiration warning to user {} (cart: {})", 
                userId, cart.getId());
    }

    private void sendUrgentNotification(Cart cart) {
        ObjectId userId = cart.getUserId();
        if (userId == null) return;
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;
        
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        int itemCount = items.size();
        
        String title = "🚨 Your cart is about to expire!";
        String description = String.format(
                "URGENT: Your cart with %d item(s) worth %.2f TND will be cleared in less than 30 minutes! " +
                "Complete your purchase now before it's too late.",
                itemCount, cart.getTotal() != null ? cart.getTotal() : 0.0);
        
        notificationService.sendNotification(user, title, description,
                NotificationType.CART_EXPIRATION_URGENT, cart.getId().toHexString());
        
        log.info("🚨 Sent urgent cart expiration alert to user {} (cart: {})", 
                userId, cart.getId());
    }

    private void deleteExpiredCart(Cart cart) {
        ObjectId userId = cart.getUserId();
        
        // Delete all cart items
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        int deletedCount = items.size();
        cartItemRepository.deleteByCartId(cart.getId());
        
        // Reset cart to empty state (don't delete the cart document itself)
        cart.getCartItemIds().clear();
        cart.setSubtotal(0.0);
        cart.setDiscountAmount(0.0);
        cart.setTaxAmount(0.0);
        cart.setTotal(0.0);
        cart.setAppliedCouponCode(null);
        cart.setAppliedDiscountId(null);
        cart.setNotification24hSent(false);
        cart.setNotification47hSent(false);
        cart.setLastUpdated(LocalDateTime.now());
        cartRepository.save(cart);
        
        // Send deletion notification
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                String title = "🗑️ Your cart has been cleared";
                String description = String.format(
                        "Your cart with %d item(s) has been automatically cleared due to inactivity (48 hours). " +
                        "You can add products again anytime.",
                        deletedCount);
                
                notificationService.sendNotification(user, title, description,
                        NotificationType.CART_EXPIRATION_WARNING, null);
            }
        }
        
        log.info("🗑️ Expired cart {} cleaned up ({} items removed)", 
                cart.getId(), deletedCount);
    }
}
