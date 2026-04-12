package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.CartItemStatus;
import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.dto.cartDto.*;
import esprit_market.entity.cart.*;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.user.User;
import esprit_market.mappers.cartMapper.CartItemMapper;
import esprit_market.mappers.cartMapper.CartMapper;
import esprit_market.repository.cartRepository.CartItemRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.cartRepository.CouponRepository;
import esprit_market.repository.cartRepository.DiscountRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Business Rules for Coupons:
 * 
 * applyCoupon():
 * - Validation only (active, expiration, usageLimit, minCartAmount)
 * - Discount calculation preview
 * - NO coupon state modification (usageCount NOT incremented)
 * 
 * checkout():
 * - Re-validate coupon (could have expired or reached limit since applyCoupon)
 * - Change cart status DRAFT → CONFIRMED
 * - Freeze totals
 * - Increment coupon usageCount ONLY here
 * - Save all atomically (@Transactional)
 */

/**
 * Service implementation responsible for managing shopping cart logic.
 * Handles cart creation, item management, discounts, coupons, checkout, and totals calculation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CartServiceImpl implements ICartService {

    // --- Repositories for database access ---
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final DiscountRepository discountRepository;
    private final UserRepository userRepository;

    // --- Mappers for converting Entity <-> DTO ---
    private final CartMapper cartMapper;
    private final CartItemMapper cartItemMapper;

    // --- External service for loyalty points ---
    private final LoyaltyCardServiceImpl loyaltyCardService;
    
    // --- Stock management service ---
    private final StockManagementService stockManagementService;

    // Tax rate applied after discount
    private static final double TAX_RATE = 0.18;

    private User getUserById(ObjectId userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Cart getUserCart(ObjectId userId, CartStatus status) {
        User user = getUserById(userId);
        if (status == CartStatus.DRAFT) {
            return getSingleDraftCartOrThrow(user);
        }
        return cartRepository.findByUserAndStatus(user, status)
                .orElseThrow(() -> new CartNotFoundException("Cart not found"));
    }

    private Cart getUserCartOrElse(ObjectId userId, CartStatus status, Cart defaultCart) {
        User user = getUserById(userId);
        if (status == CartStatus.DRAFT) {
            return getSingleDraftCart(user);
        }
        return cartRepository.findByUserAndStatus(user, status).orElse(defaultCart);
    }

    /**
     * Get user's active draft cart.
     * If none exists, create a new one.
     * If multiple exist, consolidate them into one.
     */
    @Override
    public CartResponse getOrCreateCart(ObjectId userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Cart cart = getSingleDraftCart(user);
        return cartMapper.toResponse(cart);
    }

    private Cart getSingleDraftCart(User user) {
        List<Cart> draftCarts = cartRepository.findAllByUserAndStatus(user, CartStatus.DRAFT);
        
        if (draftCarts.isEmpty()) {
            return createNewCart(user);
        } else if (draftCarts.size() == 1) {
            return draftCarts.get(0);
        } else {
            return consolidateMultipleCarts(user, draftCarts);
        }
    }

    private Cart getSingleDraftCartOrThrow(User user) {
        List<Cart> draftCarts = cartRepository.findAllByUserAndStatus(user, CartStatus.DRAFT);
        
        if (draftCarts.isEmpty()) {
            throw new CartNotFoundException("Cart not found");
        } else if (draftCarts.size() == 1) {
            return draftCarts.get(0);
        } else {
            return consolidateMultipleCarts(user, draftCarts);
        }
    }

    /**
     * Create a brand new empty cart for the user
     * and link it to the User document.
     */
    private Cart createNewCart(User user) {

        Cart cart = Cart.builder()
                .user(user)
                .userId(user.getId())
                .creationDate(LocalDateTime.now())
                .lastUpdated(LocalDateTime.now())
                .subtotal(0.0)
                .discountAmount(0.0)
                .taxAmount(0.0)
                .total(0.0)
                .status(CartStatus.DRAFT)
                .cartItemIds(new ArrayList<>())
                .build();

        return cartRepository.save(cart);
    }

    /**
     * Consolidate multiple draft carts into one.
     * Keep the most recent one and merge items from others.
     */
    private Cart consolidateMultipleCarts(User user, List<Cart> draftCarts) {
        // Sort by last updated, keep the most recent one
        Cart mainCart = draftCarts.stream()
                .max((c1, c2) -> c1.getLastUpdated().compareTo(c2.getLastUpdated()))
                .orElse(draftCarts.get(0));

        // Collect all cart items from other carts
        List<ObjectId> allItemIds = new ArrayList<>(mainCart.getCartItemIds());
        
        for (Cart cart : draftCarts) {
            if (!cart.getId().equals(mainCart.getId())) {
                // Merge cart items
                if (cart.getCartItemIds() != null) {
                    for (ObjectId itemId : cart.getCartItemIds()) {
                        // Update cart item to point to main cart
                        cartItemRepository.findById(itemId).ifPresent(item -> {
                            item.setCartId(mainCart.getId());
                            cartItemRepository.save(item);
                            allItemIds.add(itemId);
                        });
                    }
                }
                // Delete the duplicate cart
                cartRepository.delete(cart);
            }
        }

        // Update main cart with all items
        mainCart.setCartItemIds(allItemIds);
        mainCart.setLastUpdated(LocalDateTime.now());
        Cart savedCart = cartRepository.save(mainCart);

        // Recalculate totals
        return recalculateCartInternal(savedCart.getId());
    }

    /**
     * Get the active draft cart for a specific user.
     * Throws exception if not found.
     */
    @Override
    public CartResponse getCartByUserId(ObjectId userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Cart cart = getSingleDraftCartOrThrow(user);
        return cartMapper.toResponse(cart);
    }

    /**
     * Add a product to the cart.
     * If item already exists -> increase quantity.
     * Otherwise create new CartItem.
     */
    @Override
    @Transactional
    public CartItemResponse addProductToCart(ObjectId userId, AddToCartRequest request) {

        // Validate quantity
        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        // Validate Mongo ObjectId format
        if (!isValidObjectId(request.getProductId())) {
            throw new IllegalArgumentException("Invalid product ID format.");
        }

        ObjectId productId = new ObjectId(request.getProductId());

        // Get existing cart or create one using the safe method
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Cart cart = getSingleDraftCart(user);

        // Fetch product
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Check stock availability using the stock management service
        stockManagementService.validateStockAvailability(productId, request.getQuantity());

        // Check if product already exists in cart
        CartItem existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElse(null);

        // If exists -> update quantity
        if (existingItem != null) {

            int newQuantity = existingItem.getQuantity() + request.getQuantity();

            // Validate total quantity with stock management service
            stockManagementService.validateStockAvailability(productId, newQuantity);

            existingItem.setQuantity(newQuantity);
            existingItem.setSubTotal(existingItem.getUnitPrice() * newQuantity);

            CartItem updated = cartItemRepository.save(existingItem);

            // Recalculate totals
            recalculateCartInternal(cart.getId());

            return cartItemMapper.toResponse(updated);
        }

        // Otherwise create new cart item
        CartItem cartItem = CartItem.builder()
                .cartId(cart.getId())
                .productId(productId)
                .productName(product.getName())
                .quantity(request.getQuantity())
                .unitPrice(product.getPrice())
                .subTotal(product.getPrice() * request.getQuantity())
                .discountApplied(0.0)
                .build();

        CartItem saved = cartItemRepository.save(cartItem);

        // Add item reference to cart
        cart.getCartItemIds().add(saved.getId());
        cart.setLastUpdated(LocalDateTime.now());
        cartRepository.save(cart);

        // Recalculate totals
        recalculateCartInternal(cart.getId());

        return cartItemMapper.toResponse(saved);
    }

    /**
     * Update quantity of an existing cart item.
     */
    @Override
    @Transactional
    public CartItemResponse updateCartItemQuantity(ObjectId userId, ObjectId cartItemId, UpdateCartItemRequest request) {

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than 0");
        }

        User user = getUserById(userId);
        Cart cart = getSingleDraftCartOrThrow(user);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        // Ensure item belongs to this cart
        if (!cartItem.getCartId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to user's cart");
        }

        Product product = productRepository.findById(cartItem.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Check stock with stock management service
        stockManagementService.validateStockAvailability(cartItem.getProductId(), request.getQuantity());

        cartItem.setQuantity(request.getQuantity());
        cartItem.setSubTotal(cartItem.getUnitPrice() * request.getQuantity());

        CartItem updated = cartItemRepository.save(cartItem);

        cart.setLastUpdated(LocalDateTime.now());
        cartRepository.save(cart);

        recalculateCartInternal(cart.getId());

        return cartItemMapper.toResponse(updated);
    }

    /**
     * Remove one item from the cart.
     */
    @Override
    @Transactional
    public void removeCartItem(ObjectId userId, ObjectId cartItemId) {

        User user = getUserById(userId);
        Cart cart = getSingleDraftCartOrThrow(user);

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!cartItem.getCartId().equals(cart.getId())) {
            throw new IllegalArgumentException("Cart item does not belong to user's cart");
        }

        cartItemRepository.deleteById(cartItemId);

        cart.getCartItemIds().remove(cartItemId);
        cart.setLastUpdated(LocalDateTime.now());
        cartRepository.save(cart);

        recalculateCartInternal(cart.getId());
    }

    /**
     * Remove all items and reset totals in user's cart.
     */
    @Override
    @Transactional
    public void clearCart(ObjectId userId) {

        User user = getUserById(userId);
        Cart cart = getSingleDraftCartOrThrow(user);

        cartItemRepository.deleteByCartId(cart.getId());

        cart.getCartItemIds().clear();
        cart.setSubtotal(0.0);
        cart.setDiscountAmount(0.0);
        cart.setTaxAmount(0.0);
        cart.setTotal(0.0);
        cart.setAppliedCouponCode(null);
        cart.setAppliedDiscountId(null);
        cart.setLastUpdated(LocalDateTime.now());

        cartRepository.save(cart);
    }

    /**
     * Get all items for a specific cart.
     */
    @Override
    public List<CartItemResponse> findByCartId(ObjectId cartId) {
        return cartItemRepository.findByCartId(cartId).stream()
                .map(cartItemMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Delete all items and reset cart by cart ID.
     */
    @Override
    @Transactional
    public void deleteByCartId(ObjectId cartId) {

        cartItemRepository.deleteByCartId(cartId);

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found"));

        cart.getCartItemIds().clear();
        cart.setSubtotal(0.0);
        cart.setDiscountAmount(0.0);
        cart.setTaxAmount(0.0);
        cart.setTotal(0.0);
        cart.setAppliedCouponCode(null);
        cart.setAppliedDiscountId(null);
        cart.setLastUpdated(LocalDateTime.now());

        cartRepository.save(cart);
    }

    // ===================== PRIVATE HELPERS =====================

    /**
     * Recalculate subtotal, discounts, tax, and total.
     * Called after any cart modification.
     */
    private Cart recalculateCartInternal(ObjectId cartId) {

        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new CartNotFoundException("Cart not found"));

        List<CartItem> items = cartItemRepository.findByCartId(cartId);

        // Sum all item subtotals
        double subtotal = items.stream()
                .mapToDouble(i -> i.getSubTotal() != null ? i.getSubTotal() : 0.0)
                .sum();

        double discountAmount = 0.0;

        // Apply discount entity
        if (cart.getAppliedDiscountId() != null) {
            Discount discount = discountRepository.findById(cart.getAppliedDiscountId()).orElse(null);
            if (discount != null && Boolean.TRUE.equals(discount.getActive())) {
                discountAmount += calculateDiscountAmount(subtotal, discount);
            }
        }

        // Apply coupon entity
        if (cart.getAppliedCouponCode() != null) {
            Coupons coupon = couponRepository.findByCode(cart.getAppliedCouponCode()).orElse(null);
            if (coupon != null && Boolean.TRUE.equals(coupon.getActive())) {
                discountAmount += calculateDiscountAmount(
                        subtotal,
                        coupon.getDiscountType(),
                        coupon.getDiscountValue()
                );
            }
        }

        // Ensure total doesn't go negative
        double afterDiscount = Math.max(0, subtotal - discountAmount);

        double taxAmount = afterDiscount * TAX_RATE;
        double total = afterDiscount + taxAmount;

        cart.setSubtotal(subtotal);
        cart.setDiscountAmount(discountAmount);
        cart.setTaxAmount(taxAmount);
        cart.setTotal(total);
        cart.setLastUpdated(LocalDateTime.now());

        return cartRepository.save(cart);
    }

    /**
     * Calculate discount using Discount entity.
     */
    private double calculateDiscountAmount(double subtotal, Discount discount) {
        return calculateDiscountAmount(subtotal, discount.getDiscountType(), discount.getDiscountValue());
    }

    /**
     * Generic discount calculator.
     * Supports percentage and fixed value.
     */
    private double calculateDiscountAmount(double subtotal, DiscountType type, Double value) {

        if (value == null) return 0.0;

        return switch (type) {
            case PERCENTAGE -> subtotal * (value / 100.0);
            case FIXED -> Math.min(value, subtotal);
        };
    }

    /**
     * Apply coupon code to cart after validation.
     * 
     * Business Rules:
     * - Validation ONLY (no coupon state modification)
     * - Validates: active, expirationDate, usageLimit, minCartAmount
     * - Validates: user level eligibility
     * - Validates: combination rules (if discount already applied)
     * - usageCount is NOT incremented here (only at checkout)
     */
    @Override
    @Transactional
    public CartResponse applyCoupon(ObjectId userId, ApplyCouponRequest request) {

        User user = getUserById(userId);
        Cart cart = getSingleDraftCartOrThrow(user);

        Coupons coupon = couponRepository.findByCode(request.getCouponCode())
                .orElseThrow(() -> new CouponNotValidException("Coupon not found"));

        // Validate coupon is active
        if (!Boolean.TRUE.equals(coupon.getActive()))
            throw new CouponNotValidException("Coupon is not active");

        // Validate coupon has not expired
        if (coupon.getExpirationDate() != null &&
                coupon.getExpirationDate().isBefore(LocalDate.now()))
            throw new CouponNotValidException("Coupon has expired");

        // Validate usage limit not reached
        if (coupon.getUsageLimit() != null &&
                coupon.getUsageCount() != null &&
                coupon.getUsageCount() >= coupon.getUsageLimit())
            throw new CouponNotValidException("Coupon usage limit reached");

        // Calculate current cart subtotal for minCartAmount validation
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        double subtotal = items.stream()
                .mapToDouble(i -> i.getSubTotal() != null ? i.getSubTotal() : 0.0)
                .sum();

        // Validate minCartAmount requirement
        if (coupon.getMinCartAmount() != null && subtotal < coupon.getMinCartAmount()) {
            throw new CouponNotValidException(
                    "Cart total does not meet minimum amount. Required: " + coupon.getMinCartAmount() +
                    ", Current: " + subtotal);
        }
        
        // Validate user level eligibility
        if (coupon.getEligibleUserLevel() != null && !coupon.getEligibleUserLevel().isEmpty()) {
            LoyaltyCard loyaltyCard = loyaltyCardService.getOrCreateLoyaltyCardEntity(userId);
            String userLevel = loyaltyCard.getLevel() != null ? loyaltyCard.getLevel() : "BRONZE";
            
            if (!isUserLevelEligible(userLevel, coupon.getEligibleUserLevel())) {
                throw new CouponNotValidException(
                        "This coupon requires " + coupon.getEligibleUserLevel() + " level or higher. " +
                        "Your current level: " + userLevel);
            }
        }
        
        // Validate combination rules - if discount already applied
        if (cart.getAppliedDiscountId() != null && !Boolean.TRUE.equals(coupon.getCombinableWithDiscount())) {
            throw new CouponNotValidException(
                    "This coupon cannot be combined with other discounts. " +
                    "Please remove the existing discount first.");
        }

        // Apply coupon code to cart (preview only - no usageCount increment)
        cart.setAppliedCouponCode(request.getCouponCode());
        cart.setLastUpdated(LocalDateTime.now());

        cartRepository.save(cart);

        Cart recalculated = recalculateCartInternal(cart.getId());
        return cartMapper.toResponse(recalculated);
    }
    
    /**
     * Check if user level meets or exceeds required level.
     * Level hierarchy: PLATINUM > GOLD > SILVER > BRONZE
     */
    private boolean isUserLevelEligible(String userLevel, String requiredLevel) {
        int userLevelRank = getLevelRank(userLevel);
        int requiredLevelRank = getLevelRank(requiredLevel);
        return userLevelRank >= requiredLevelRank;
    }
    
    private int getLevelRank(String level) {
        if (level == null) return 0;
        return switch (level.toUpperCase()) {
            case "PLATINUM" -> 4;
            case "GOLD" -> 3;
            case "SILVER" -> 2;
            case "BRONZE" -> 1;
            default -> 0;
        };
    }

    /**
     * Apply discount entity to cart.
     */
    @Override
    @Transactional
    public CartResponse applyDiscount(ObjectId userId, ObjectId discountId) {

        User user = getUserById(userId);
        Cart cart = getSingleDraftCartOrThrow(user);

        Discount discount = discountRepository.findById(discountId)
                .orElseThrow(() -> new DiscountNotValidException("Discount not found"));

        cart.setAppliedDiscountId(discountId);
        cart.setLastUpdated(LocalDateTime.now());

        cartRepository.save(cart);

        Cart recalculated = recalculateCartInternal(cart.getId());
        return cartMapper.toResponse(recalculated);
    }

    /**
     * Remove coupon from cart.
     */
    @Override
    @Transactional
    public CartResponse removeCoupon(ObjectId userId) {

        User user = getUserById(userId);
        Cart cart = getSingleDraftCartOrThrow(user);

        cart.setAppliedCouponCode(null);
        cart.setLastUpdated(LocalDateTime.now());

        cartRepository.save(cart);

        Cart recalculated = recalculateCartInternal(cart.getId());
        return cartMapper.toResponse(recalculated);
    }

    /**
     * Remove discount from cart.
     */
    @Override
    @Transactional
    public CartResponse removeDiscount(ObjectId userId) {

        User user = getUserById(userId);
        Cart cart = getSingleDraftCartOrThrow(user);

        cart.setAppliedDiscountId(null);
        cart.setLastUpdated(LocalDateTime.now());

        cartRepository.save(cart);

        Cart recalculated = recalculateCartInternal(cart.getId());
        return cartMapper.toResponse(recalculated);
    }

    /**
     * Checkout process:
     * - Validate cart not empty
     * - Re-validate coupon (could have expired or reached limit since applyCoupon)
     * - Reduce product stock
     * - Confirm cart (DRAFT → CONFIRMED)
     * - Increment coupon usageCount ONLY here
     * - Add loyalty points
     * - All operations are atomic via @Transactional
     */
    /**
     * @deprecated This method is DEPRECATED and creates architectural problems.
     * 
     * ❌ PROBLEM: This method only updates Cart status (DRAFT → PENDING)
     * ❌ PROBLEM: Does NOT create Order entities in MongoDB
     * ❌ PROBLEM: MongoDB orders collection remains empty
     * ❌ PROBLEM: Provider dashboard cannot find orders
     * 
     * ✅ SOLUTION: Use IOrderService.createOrderFromCart() instead
     * 
     * This method is kept for backward compatibility only but should NOT be used.
     * CartController.checkout() has been updated to use OrderService instead.
     */
    @Override
    @Transactional
    @Deprecated
    public CartResponse checkout(ObjectId userId, CheckoutRequest request) {

        Cart cart = getUserCart(userId, CartStatus.DRAFT);

        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());

        if (items.isEmpty())
            throw new IllegalArgumentException("Cannot checkout empty cart");

        // Re-validate and process coupon at checkout time
        Coupons couponToIncrement = null;
        if (cart.getAppliedCouponCode() != null) {
            Coupons coupon = couponRepository.findByCode(cart.getAppliedCouponCode())
                    .orElse(null);

            if (coupon != null) {
                // Re-validate coupon is still valid at checkout time
                if (!Boolean.TRUE.equals(coupon.getActive())) {
                    throw new CouponNotValidException("Coupon is no longer active");
                }
                if (coupon.getExpirationDate() != null &&
                        coupon.getExpirationDate().isBefore(LocalDate.now())) {
                    throw new CouponNotValidException("Coupon has expired");
                }
                if (coupon.getUsageLimit() != null &&
                        coupon.getUsageCount() != null &&
                        coupon.getUsageCount() >= coupon.getUsageLimit()) {
                    throw new CouponNotValidException("Coupon usage limit reached");
                }

                // Re-validate minCartAmount at checkout
                if (coupon.getMinCartAmount() != null && cart.getSubtotal() < coupon.getMinCartAmount()) {
                    throw new CouponNotValidException(
                            "Cart total does not meet minimum amount. Required: " + coupon.getMinCartAmount());
                }

                // Mark coupon for usage increment after successful checkout
                couponToIncrement = coupon;
            }
        }

        // ⚠️ WARNING: This method does NOT create Order entities
        // Stock reduction happens here but Order is never created
        // This causes provider dashboard to show empty results
        java.util.Map<ObjectId, Integer> stockReductions = new java.util.HashMap<>();
        for (CartItem item : items) {
            stockReductions.put(item.getProductId(), item.getQuantity());
        }
        
        stockManagementService.batchReduceStock(stockReductions);

        // Increment coupon usageCount
        if (couponToIncrement != null) {
            int currentUsage = couponToIncrement.getUsageCount() != null ? couponToIncrement.getUsageCount() : 0;
            couponToIncrement.setUsageCount(currentUsage + 1);

            // Auto-deactivate if usage limit reached
            if (couponToIncrement.getUsageLimit() != null &&
                    couponToIncrement.getUsageCount() >= couponToIncrement.getUsageLimit()) {
                couponToIncrement.setActive(false);
            }

            couponRepository.save(couponToIncrement);
        }

        // ❌ PROBLEM: Only changes Cart status, does NOT create Order
        cart.setStatus(CartStatus.PENDING);
        cart.setShippingAddress(request.getShippingAddress());
        cart.setBillingAddress(request.getBillingAddress());
        cart.setNotes(request.getNotes());
        cart.setLastUpdated(LocalDateTime.now());

        Cart confirmed = cartRepository.save(cart);

        // Reward loyalty points
        loyaltyCardService.addPointsForCart(userId, confirmed.getTotal());

        return cartMapper.toResponse(confirmed);
    }

    /**
     * Get all carts in system.
     */
    @Override
    public List<CartResponse> findAllCarts() {
        return cartRepository.findAll().stream()
                .map(cartMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all confirmed orders for a user (not drafts).
     */
    @Override
    public List<CartResponse> getUserOrders(ObjectId userId) {
        User user = getUserById(userId);
        return cartRepository.findByUser(user).stream()
                .filter(cart -> cart.getStatus() != CartStatus.DRAFT)
                .map(cartMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get a specific order by ID for a user.
     */
    @Override
    public CartResponse getOrderById(ObjectId userId, ObjectId orderId) {
        Cart order = cartRepository.findById(orderId)
                .orElseThrow(() -> new CartNotFoundException("Order not found"));
        
        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to user");
        }
        
        if (order.getStatus() == CartStatus.DRAFT) {
            throw new IllegalArgumentException("This is a cart, not an order");
        }
        
        return cartMapper.toResponse(order);
    }

    // ==================== CANCELLATION & REFUND ====================
    
    /**
     * Cancel a specific item (or partial quantity) from a confirmed order.
     * 
     * Business Rules:
     * - Only CONFIRMED or PAID orders can have items cancelled
     * - Restores stock for cancelled quantity
     * - Calculates refund amount proportionally
     * - Deducts loyalty points proportionally
     * - Updates order status based on remaining items
     */
    @Override
    @Transactional
    public RefundSummaryDTO cancelOrderItem(ObjectId userId, ObjectId orderId, CancelOrderItemRequest request) {
        Cart order = cartRepository.findById(orderId)
                .orElseThrow(() -> new CartNotFoundException("Order not found"));
        
        // Validate order belongs to user
        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to user");
        }
        
        // ⚠️ STOCK RESERVATION: Allow cancellation of PENDING, CONFIRMED or PAID orders  
        if (order.getStatus() != CartStatus.PENDING && 
            order.getStatus() != CartStatus.CONFIRMED && 
            order.getStatus() != CartStatus.PAID) {
            throw new IllegalArgumentException("Only PENDING, CONFIRMED or PAID orders can be cancelled");
        }
        
        ObjectId cartItemId = new ObjectId(request.getCartItemId());
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        
        // Validate item belongs to this order
        if (!item.getCartId().equals(orderId)) {
            throw new IllegalArgumentException("Item does not belong to this order");
        }
        
        // Validate item is not already fully cancelled
        if (item.getStatus() == CartItemStatus.CANCELLED) {
            throw new IllegalArgumentException("Item is already fully cancelled");
        }
        
        int currentQuantity = item.getQuantity() != null ? item.getQuantity() : 0;
        int cancelledQty = item.getCancelledQuantity() != null ? item.getCancelledQuantity() : 0;
        int availableToCancel = currentQuantity - cancelledQty;
        
        int quantityToCancel = request.getQuantityToCancel() != null ? 
                request.getQuantityToCancel() : availableToCancel;
        
        if (quantityToCancel > availableToCancel) {
            throw new IllegalArgumentException("Cannot cancel " + quantityToCancel + 
                    " items. Only " + availableToCancel + " available for cancellation");
        }
        
        // Calculate refund amount for cancelled quantity
        double unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : 0.0;
        double refundAmount = unitPrice * quantityToCancel;
        
        // Apply proportional discount if any
        if (order.getDiscountAmount() != null && order.getSubtotal() != null && order.getSubtotal() > 0) {
            double discountRatio = order.getDiscountAmount() / order.getSubtotal();
            refundAmount = refundAmount * (1 - discountRatio);
        }
        
        // Add tax to refund
        refundAmount = refundAmount * (1 + TAX_RATE);
        
        // Restore stock for cancelled quantity
        stockManagementService.restoreStock(item.getProductId(), quantityToCancel);
        
        // Calculate points to deduct proportionally
        int pointsToDeduct = loyaltyCardService.calculatePointsForAmount(userId, refundAmount);
        int actualPointsDeducted = loyaltyCardService.deductPoints(userId, pointsToDeduct);
        
        // Update cart item
        item.setCancelledQuantity(cancelledQty + quantityToCancel);
        item.setRefundAmount((item.getRefundAmount() != null ? item.getRefundAmount() : 0.0) + refundAmount);
        item.setCancellationReason(request.getReason());
        
        // Determine item status
        if (item.getCancelledQuantity() >= currentQuantity) {
            item.setStatus(CartItemStatus.CANCELLED);
        } else {
            item.setStatus(CartItemStatus.PARTIALLY_CANCELLED);
        }
        
        cartItemRepository.save(item);
        
        // Update order status and totals
        updateOrderAfterCancellation(order);
        
        // Build refund summary
        return buildRefundSummary(order, actualPointsDeducted);
    }
    
    /**
     * Cancel entire order.
     * - Restores all stock
     * - Calculates full refund
     * - Deducts all loyalty points earned
     * - Changes order status to CANCELLED
     */
    @Override
    @Transactional
    public RefundSummaryDTO cancelOrder(ObjectId userId, ObjectId orderId, CancelOrderRequest request) {
        Cart order = cartRepository.findById(orderId)
                .orElseThrow(() -> new CartNotFoundException("Order not found"));
        
        // Validate order belongs to user
        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to user");
        }
        
        // Validate order status allows cancellation
        if (order.getStatus() != CartStatus.CONFIRMED && order.getStatus() != CartStatus.PAID) {
            throw new IllegalArgumentException("Only CONFIRMED or PAID orders can be cancelled");
        }
        
        List<CartItem> items = cartItemRepository.findByCartId(orderId);
        double totalRefund = 0.0;
        
        for (CartItem item : items) {
            if (item.getStatus() == CartItemStatus.CANCELLED) continue;
            
            int currentQuantity = item.getQuantity() != null ? item.getQuantity() : 0;
            int cancelledQty = item.getCancelledQuantity() != null ? item.getCancelledQuantity() : 0;
            int quantityToCancel = currentQuantity - cancelledQty;
            
            if (quantityToCancel > 0) {
                // ⚠️ CRITICAL: RESTORE STOCK when order is cancelled
                // This returns stock to available inventory
                stockManagementService.restoreStock(item.getProductId(), quantityToCancel);
                
                // Calculate refund
                double unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : 0.0;
                double itemRefund = unitPrice * quantityToCancel;
                totalRefund += itemRefund;
                
                // Update item
                item.setCancelledQuantity(currentQuantity);
                item.setRefundAmount((item.getRefundAmount() != null ? item.getRefundAmount() : 0.0) + itemRefund);
                item.setStatus(CartItemStatus.CANCELLED);
                item.setCancellationReason(request != null ? request.getReason() : "Full order cancellation");
                cartItemRepository.save(item);
            }
        }
        
        // Apply discount reduction and tax to total refund
        if (order.getDiscountAmount() != null && order.getSubtotal() != null && order.getSubtotal() > 0) {
            double discountRatio = order.getDiscountAmount() / order.getSubtotal();
            totalRefund = totalRefund * (1 - discountRatio);
        }
        totalRefund = totalRefund * (1 + TAX_RATE);
        
        // Deduct all loyalty points
        int pointsToDeduct = loyaltyCardService.calculatePointsForAmount(userId, order.getTotal());
        int actualPointsDeducted = loyaltyCardService.deductPoints(userId, pointsToDeduct);
        
        // Decrement coupon usage if one was applied
        if (order.getAppliedCouponCode() != null) {
            Coupons coupon = couponRepository.findByCode(order.getAppliedCouponCode()).orElse(null);
            if (coupon != null) {
                int currentUsage = coupon.getUsageCount() != null ? coupon.getUsageCount() : 0;
                if (currentUsage > 0) {
                    coupon.setUsageCount(currentUsage - 1);
                    // Re-activate if was deactivated due to limit
                    if (coupon.getUsageLimit() != null && 
                        coupon.getUsageCount() < coupon.getUsageLimit() &&
                        (coupon.getExpirationDate() == null || !coupon.getExpirationDate().isBefore(LocalDate.now()))) {
                        coupon.setActive(true);
                    }
                    couponRepository.save(coupon);
                }
            }
        }
        
        // Update order status
        order.setStatus(CartStatus.CANCELLED);
        order.setLastUpdated(LocalDateTime.now());
        cartRepository.save(order);
        
        return buildRefundSummary(order, actualPointsDeducted);
    }
    
    /**
     * Get refund summary for an order.
     */
    @Override
    public RefundSummaryDTO getRefundSummary(ObjectId userId, ObjectId orderId) {
        Cart order = cartRepository.findById(orderId)
                .orElseThrow(() -> new CartNotFoundException("Order not found"));
        
        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to user");
        }
        
        return buildRefundSummary(order, 0);
    }
    
    /**
     * Update order totals and status after cancellation.
     */
    private void updateOrderAfterCancellation(Cart order) {
        List<CartItem> items = cartItemRepository.findByCartId(order.getId());
        
        // Check if all items are cancelled
        boolean allCancelled = items.stream()
                .allMatch(item -> item.getStatus() == CartItemStatus.CANCELLED);
        
        boolean anyCancelled = items.stream()
                .anyMatch(item -> item.getStatus() == CartItemStatus.CANCELLED || 
                                  item.getStatus() == CartItemStatus.PARTIALLY_CANCELLED);
        
        if (allCancelled) {
            order.setStatus(CartStatus.CANCELLED);
        } else if (anyCancelled) {
            order.setStatus(CartStatus.PARTIALLY_CANCELLED);
        }
        
        // Calculate remaining total
        double remainingSubtotal = items.stream()
                .mapToDouble(item -> {
                    int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    int cancelled = item.getCancelledQuantity() != null ? item.getCancelledQuantity() : 0;
                    double price = item.getUnitPrice() != null ? item.getUnitPrice() : 0.0;
                    return (qty - cancelled) * price;
                })
                .sum();
        
        // Recalculate totals (keep discount ratio)
        double discountRatio = (order.getSubtotal() != null && order.getSubtotal() > 0 && order.getDiscountAmount() != null) ?
                order.getDiscountAmount() / order.getSubtotal() : 0.0;
        
        double newDiscount = remainingSubtotal * discountRatio;
        double afterDiscount = remainingSubtotal - newDiscount;
        double newTax = afterDiscount * TAX_RATE;
        double newTotal = afterDiscount + newTax;
        
        // Note: We don't update the original totals to preserve history
        // The refund amounts are tracked at the item level
        
        order.setLastUpdated(LocalDateTime.now());
        cartRepository.save(order);
    }
    
    /**
     * Build RefundSummaryDTO from order.
     */
    private RefundSummaryDTO buildRefundSummary(Cart order, int pointsDeducted) {
        List<CartItem> items = cartItemRepository.findByCartId(order.getId());
        
        List<RefundSummaryDTO.RefundedItemDTO> refundedItems = items.stream()
                .filter(item -> item.getCancelledQuantity() != null && item.getCancelledQuantity() > 0)
                .map(item -> RefundSummaryDTO.RefundedItemDTO.builder()
                        .cartItemId(item.getId().toHexString())
                        .productName(item.getProductName())
                        .cancelledQuantity(item.getCancelledQuantity())
                        .refundAmount(item.getRefundAmount())
                        .status(item.getStatus())
                        .reason(item.getCancellationReason())
                        .build())
                .collect(Collectors.toList());
        
        double totalRefunded = refundedItems.stream()
                .mapToDouble(item -> item.getRefundAmount() != null ? item.getRefundAmount() : 0.0)
                .sum();
        
        double remainingTotal = (order.getTotal() != null ? order.getTotal() : 0.0) - totalRefunded;
        
        return RefundSummaryDTO.builder()
                .orderId(order.getId().toHexString())
                .orderStatus(order.getStatus())
                .originalTotal(order.getTotal())
                .refundedAmount(totalRefunded)
                .remainingTotal(Math.max(0, remainingTotal))
                .refundedItems(refundedItems)
                .refundDate(LocalDateTime.now())
                .loyaltyPointsDeducted(pointsDeducted)
                .build();
    }

    // ==================== ORDER STATUS MANAGEMENT ====================
    
    /**
     * Update order status (PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED)
     */
    @Override
    @Transactional
    public CartResponse updateOrderStatus(ObjectId userId, ObjectId orderId, CartStatus newStatus) {
        Cart order = cartRepository.findById(orderId)
                .orElseThrow(() -> new CartNotFoundException("Order not found"));
        
        // Validate order belongs to user (or is admin)
        if (!order.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Order does not belong to user");
        }
        
        // Validate status transition
        validateStatusTransition(order.getStatus(), newStatus);
        
        // Update status
        order.setStatus(newStatus);
        order.setLastUpdated(LocalDateTime.now());
        
        Cart updated = cartRepository.save(order);
        
        log.info("Order status updated: OrderId={}, From={}, To={}", 
                orderId, order.getStatus(), newStatus);
        
        return cartMapper.toResponse(updated);
    }
    
    /**
     * Validate that status transition is allowed
     */
    private void validateStatusTransition(CartStatus currentStatus, CartStatus newStatus) {
        // Define allowed transitions
        boolean isValidTransition = switch (currentStatus) {
            case DRAFT -> newStatus == CartStatus.PENDING;
            case PENDING -> newStatus == CartStatus.CONFIRMED || newStatus == CartStatus.CANCELLED;
            case CONFIRMED -> newStatus == CartStatus.PROCESSING || newStatus == CartStatus.CANCELLED;
            case PROCESSING -> newStatus == CartStatus.SHIPPED || newStatus == CartStatus.CANCELLED;
            case SHIPPED -> newStatus == CartStatus.DELIVERED;
            case DELIVERED -> false; // Final state
            case CANCELLED -> false; // Final state
            default -> false;
        };
        
        if (!isValidTransition) {
            throw new IllegalArgumentException(
                String.format("Invalid status transition from %s to %s", currentStatus, newStatus));
        }
    }

    /**
     * Get orders by status for a user
     */
    @Override
    public List<CartResponse> getUserOrdersByStatus(ObjectId userId, CartStatus status) {
        User user = getUserById(userId);
        return cartRepository.findByUser(user).stream()
                .filter(cart -> cart.getStatus() == status)
                .map(cartMapper::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Mark order as paid (external payment confirmation)
     */
    @Override
    @Transactional
    public CartResponse markOrderAsPaid(ObjectId userId, ObjectId orderId) {
        return updateOrderStatus(userId, orderId, CartStatus.CONFIRMED);
    }
    
    /**
     * Process order (start preparation)
     */
    @Override
    @Transactional
    public CartResponse processOrder(ObjectId userId, ObjectId orderId) {
        return updateOrderStatus(userId, orderId, CartStatus.PROCESSING);
    }
    
    /**
     * Ship order
     */
    @Override
    @Transactional
    public CartResponse shipOrder(ObjectId userId, ObjectId orderId) {
        return updateOrderStatus(userId, orderId, CartStatus.SHIPPED);
    }
    
    /**
     * Deliver order
     */
    @Override
    @Transactional
    public CartResponse deliverOrder(ObjectId userId, ObjectId orderId) {
        return updateOrderStatus(userId, orderId, CartStatus.DELIVERED);
    }

    // ==================== STOCK MANAGEMENT HELPERS ====================
    
    /**
     * Get current stock level for a product
     */
    public int getProductStock(ObjectId productId) {
        return stockManagementService.getCurrentStock(productId);
    }
    
    /**
     * Check if product is available for purchase
     */
    public boolean isProductAvailable(ObjectId productId) {
        return stockManagementService.isProductAvailable(productId);
    }
    private boolean isValidObjectId(String id) {
        return id != null && !id.isEmpty()
                && id.length() == 24
                && id.matches("[0-9a-fA-F]{24}");
    }
}