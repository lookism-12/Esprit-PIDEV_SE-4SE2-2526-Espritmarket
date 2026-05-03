package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.OrderItemStatus;
import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.Enum.cartEnum.PaymentStatus;
import esprit_market.dto.cartDto.*;
import esprit_market.entity.cart.*;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.mappers.cartMapper.OrderItemMapper;
import esprit_market.mappers.cartMapper.OrderMapper;
import esprit_market.repository.cartRepository.*;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.marketplaceService.IProductService;
import esprit_market.entity.SAV.Delivery;
import esprit_market.repository.SAVRepository.DeliveryRepository;
import esprit_market.service.notificationService.NotificationService;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.service.RecommendationIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements IOrderService {
    
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final ICouponsService couponService;
    private final ILoyaltyCardService loyaltyCardService;
    private final StockManagementService stockManagementService;
    private final DeliveryRepository deliveryRepository;
    private final PromotionEngineService promotionEngineService;
    private final OrderStatusValidator orderStatusValidator;
    private final ShopRepository shopRepository;
    private final NotificationService notificationService;
    private final RecommendationIntegrationService recommendationIntegration;

    private void ensureDeliveryRecordForOrder(Order order) {
        if (order == null || order.getId() == null) {
            return;
        }

        if (order.getDeliveryId() != null && deliveryRepository.existsById(order.getDeliveryId())) {
            return;
        }

        var existingDelivery = deliveryRepository.findByOrderId(order.getId());
        if (existingDelivery.isPresent()) {
            order.setDeliveryId(existingDelivery.get().getId());
            orderRepository.save(order);
            return;
        }

        Delivery delivery = Delivery.builder()
                .orderId(order.getId())
                .cartId(order.getCartId())
                .address(order.getShippingAddress())
                .deliveryDate(LocalDateTime.now())
                .status("PREPARING")
                .deliveryConfirmationCode(generateDeliveryConfirmationCode())
                .build();

        Delivery savedDelivery = deliveryRepository.save(delivery);
        order.setDeliveryId(savedDelivery.getId());
        orderRepository.save(order);
    }

    private String generateDeliveryConfirmationCode() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
    }

    /**
     * Notify each unique provider (shop owner) whose products appear in the order.
     * For CASH orders: asks provider to confirm the order.
     * For CARD orders: informs provider that payment is received and confirmation is needed.
     */
    private void notifyProvidersForNewOrder(Order order, List<CartItem> cartItems, User buyer) {
        try {
            // Collect unique shopIds from cart items
            java.util.Set<ObjectId> shopIds = cartItems.stream()
                    .map(CartItem::getProductId)
                    .map(pid -> productRepository.findById(pid).orElse(null))
                    .filter(p -> p != null && p.getShopId() != null)
                    .map(Product::getShopId)
                    .collect(java.util.stream.Collectors.toSet());

            boolean isCash = OrderDeliveryEligibility.isCashPaymentMethod(order.getPaymentMethod());
            String paymentLabel = isCash ? "Cash on Delivery" : "Card (PAID)";
            String title = isCash
                    ? "🛒 New Order — Confirmation Required"
                    : "💳 New Paid Order — Please Confirm";
            String message = String.format(
                    "Order %s from %s %s | Payment: %s | Amount: %.2f TND. Please confirm or decline.",
                    order.getOrderNumber(),
                    buyer.getFirstName() != null ? buyer.getFirstName() : "",
                    buyer.getLastName() != null ? buyer.getLastName() : "",
                    paymentLabel,
                    order.getFinalAmount() != null ? order.getFinalAmount() : 0.0
            );

            for (ObjectId shopId : shopIds) {
                shopRepository.findById(shopId).ifPresent(shop -> {
                    if (shop.getOwnerId() != null) {
                        userRepository.findById(shop.getOwnerId()).ifPresent(provider -> {
                            try {
                                notificationService.sendNotification(
                                        provider,
                                        title,
                                        message,
                                        NotificationType.INTERNAL_NOTIFICATION,
                                        order.getId().toHexString()
                                );
                                log.info("🔔 Provider {} notified for order {}", provider.getEmail(), order.getOrderNumber());
                            } catch (Exception e) {
                                log.warn("Could not notify provider {}: {}", provider.getEmail(), e.getMessage());
                            }
                        });
                    }
                });
            }
        } catch (Exception e) {
            // Never let notification failure break the order creation
            log.warn("Provider notification failed for order {}: {}", order.getOrderNumber(), e.getMessage());
        }
    }

    private Optional<Delivery> findDeliveryForOrderResponse(Order order) {
        if (order.getDeliveryId() != null) {
            Optional<Delivery> delivery = deliveryRepository.findById(order.getDeliveryId());
            if (delivery.isPresent()) {
                return delivery;
            }
        }
        Optional<Delivery> byOrderId = deliveryRepository.findByOrderId(order.getId());
        if (byOrderId.isPresent()) {
            return byOrderId;
        }
        if (order.getCartId() != null) {
            return deliveryRepository.findByCartId(order.getCartId()).stream().findFirst();
        }
        return Optional.empty();
    }

    private Delivery ensureDeliveryCodeForOrderResponse(Order order) {
        Optional<Delivery> deliveryOpt = findDeliveryForOrderResponse(order);
        if (deliveryOpt.isEmpty()) {
            return null;
        }

        Delivery delivery = deliveryOpt.get();
        boolean changed = false;
        if (delivery.getDeliveryConfirmationCode() == null || delivery.getDeliveryConfirmationCode().isBlank()) {
            delivery.setDeliveryConfirmationCode(generateDeliveryConfirmationCode());
            changed = true;
        }
        if (delivery.getOrderId() == null && order.getId() != null) {
            delivery.setOrderId(order.getId());
            changed = true;
        }
        if (delivery.getCartId() == null && order.getCartId() != null) {
            delivery.setCartId(order.getCartId());
            changed = true;
        }
        if (order.getDeliveryId() == null && delivery.getId() != null) {
            order.setDeliveryId(delivery.getId());
            orderRepository.save(order);
        }
        return changed ? deliveryRepository.save(delivery) : delivery;
    }
    
    @Override
    @Transactional
    public OrderResponse createOrderFromCart(ObjectId userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Get user's DRAFT cart
        Cart cart = cartRepository.findByUserAndStatus(user, esprit_market.Enum.cartEnum.CartStatus.DRAFT)
                .orElseThrow(() -> new IllegalStateException("No active cart found"));
        
        // Get cart items
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cannot create order from empty cart");
        }
        
        // Validate stock availability (don't reduce yet)
        for (CartItem item : cartItems) {
            stockManagementService.validateStockAvailability(item.getProductId(), item.getQuantity());
        }
        
        // ==================== PROMOTION ENGINE INTEGRATION ====================
        // Group cart items by shop and calculate promotions per shop
        log.info("🎯 Starting promotion evaluation for cart {}", cart.getId().toHexString());
        
        Map<ObjectId, List<CartItem>> itemsByShop = new java.util.HashMap<>();
        Map<ObjectId, AppliedPromotionDTO> promotionsByShop = new java.util.HashMap<>();
        double totalPromotionDiscount = 0.0;
        
        // Group items by shop
        for (CartItem item : cartItems) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalStateException("Product not found: " + item.getProductId()));
            
            if (product.getShopId() == null) {
                throw new IllegalStateException("Product '" + product.getName() + "' has no shopId");
            }
            
            itemsByShop.computeIfAbsent(product.getShopId(), k -> new java.util.ArrayList<>()).add(item);
        }
        
        // Evaluate promotions for each shop
        for (Map.Entry<ObjectId, List<CartItem>> entry : itemsByShop.entrySet()) {
            ObjectId shopId = entry.getKey();
            List<CartItem> shopItems = entry.getValue();
            
            // Calculate shop subtotal and quantity
            double shopSubtotal = shopItems.stream()
                    .mapToDouble(CartItem::getSubTotal)
                    .sum();
            
            int shopQuantity = shopItems.stream()
                    .mapToInt(CartItem::getQuantity)
                    .sum();
            
            log.info("📦 Shop {} | Subtotal: {} TND | Quantity: {}", 
                    shopId.toHexString(), shopSubtotal, shopQuantity);
            
            // Evaluate best promotion for this shop
            AppliedPromotionDTO bestPromotion = promotionEngineService.evaluateBestPromotion(
                    shopId, 
                    userId, 
                    shopSubtotal, 
                    shopQuantity, 
                    LocalDate.now()
            );
            
            if (bestPromotion != null && bestPromotion.getDiscountAmount() > 0) {
                promotionsByShop.put(shopId, bestPromotion);
                totalPromotionDiscount += bestPromotion.getDiscountAmount();
                
                log.info("✅ Promotion applied for shop {}: {} TND ({})", 
                        shopId.toHexString(), 
                        bestPromotion.getDiscountAmount(),
                        bestPromotion.getDescription());
            } else {
                log.info("❌ No promotion applicable for shop {}", shopId.toHexString());
            }
        }
        
        // Calculate final amounts with promotions
        double originalTotal = cart.getSubtotal();
        double couponDiscount = cart.getDiscountAmount() != null ? cart.getDiscountAmount() : 0.0;
        double finalTotal = originalTotal - couponDiscount - totalPromotionDiscount;
        finalTotal = Math.max(finalTotal, 0.0); // Never go below 0
        
        log.info("💰 Order Summary | Original: {} TND | Coupon: -{} TND | Promotions: -{} TND | Final: {} TND",
                originalTotal, couponDiscount, totalPromotionDiscount, finalTotal);
        
        // ==================== END PROMOTION ENGINE ====================
        
        // Generate order number
        String orderNumber = generateOrderNumber();
        
        // ==================== NEW WORKFLOW: PAYMENT & ORDER STATUS ====================
        // Determine payment and order status based on payment method
        PaymentStatus paymentStatus;
        OrderStatus orderStatus;
        LocalDateTime paidAt = null;
        
        if (OrderDeliveryEligibility.isCardPaymentMethod(request.getPaymentMethod())) {
            // CARD PAYMENT: mark as PAID immediately — confirmPayment() will be called
            // right after by the frontend to set the paymentId, but the status is already PAID.
            paymentStatus = PaymentStatus.PAID;
            orderStatus = OrderStatus.PENDING;  // Provider must still confirm
            paidAt = LocalDateTime.now();
            log.info("💳 CARD PAYMENT - Order created as PAID, awaiting provider confirmation");
        } else {
            // CASH ON DELIVERY: Payment pending until delivery collects cash
            paymentStatus = PaymentStatus.PENDING_PAYMENT;
            orderStatus = OrderStatus.PENDING;  // Provider must confirm
            log.info("💵 CASH ON DELIVERY - Order created as PENDING_PAYMENT, awaiting provider confirmation");
        }
        
        // Create Order entity
        Order order = Order.builder()
                .user(user)
                .status(orderStatus)
                .paymentStatus(paymentStatus)
                .totalAmount(originalTotal)
                .discountAmount(couponDiscount + totalPromotionDiscount)  // Combined discounts
                .finalAmount(finalTotal)
                .couponCode(cart.getAppliedCouponCode())
                .discountId(cart.getAppliedDiscountId())
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod())
                .orderNumber(orderNumber)
                .cartId(cart.getId())  // ✅ Link order to cart for backward compatibility
                .createdAt(LocalDateTime.now())
                .paidAt(paidAt)
                .lastUpdated(LocalDateTime.now())
                .build();
        
        Order savedOrder = orderRepository.save(order);
        
        // ✅ CRITICAL: Do NOT reduce stock yet - wait for provider confirmation
        log.info("⏳ Stock will be reduced when provider confirms order");
        
        // Convert CartItems to OrderItems
        for (CartItem cartItem : cartItems) {
            // ✅ CRITICAL: Fetch product to get shopId - MUST NOT BE NULL
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new IllegalStateException(
                        "Product not found for CartItem: " + cartItem.getProductId()));
            
            // ✅ CRITICAL: Validate shopId exists
            if (product.getShopId() == null) {
                throw new IllegalStateException(
                    "Product '" + product.getName() + "' has no shopId. Cannot create order.");
            }
            
            ObjectId shopId = product.getShopId();
            
            OrderItem orderItem = OrderItem.builder()
                    .orderId(savedOrder.getId())
                    .productId(cartItem.getProductId())
                    .productName(cartItem.getProductName())
                    .productPrice(cartItem.getUnitPrice())
                    .shopId(shopId)  // ✅ CRITICAL: ALWAYS set for provider filtering
                    .quantity(cartItem.getQuantity())
                    .subtotal(cartItem.getSubTotal())
                    .status(OrderItemStatus.ACTIVE)
                    .cancelledQuantity(0)
                    .refundedAmount(0.0)
                    .build();
            
            orderItemRepository.save(orderItem);
            
            log.info("✅ ORDER ITEM CREATED - Product: {} | ProductId: {} | ShopId: {}", 
                    cartItem.getProductName(), 
                    cartItem.getProductId().toHexString(),
                    shopId.toHexString());
        }
        
        // Track purchases for recommendation system
        try {
            List<String> productIds = cartItems.stream()
                    .map(item -> item.getProductId().toHexString())
                    .collect(Collectors.toList());
            recommendationIntegration.trackMultiplePurchases(user.getId().toHexString(), productIds);
        } catch (Exception e) {
            log.warn("Failed to track purchases for recommendation: {}", e.getMessage());
        }
        
        // Clear cart (or keep it empty for next shopping session)
        cartItemRepository.deleteByCartId(cart.getId());
        cart.setSubtotal(0.0);
        cart.setDiscountAmount(0.0);
        cart.setTotal(0.0);
        cart.setAppliedCouponCode(null);
        cart.setAppliedDiscountId(null);
        cart.setLastUpdated(LocalDateTime.now());
        cartRepository.save(cart);
        
        // Increment coupon usage (order created, not yet paid)
        if (order.getCouponCode() != null) {
            couponService.incrementCouponUsage(order.getCouponCode());
        }
        
        // ✅ CRITICAL: Loyalty points will be granted when provider confirms order (for CARD) or when delivered (for CASH)
        log.info("⏳ Loyalty points will be granted when order is confirmed/delivered");
        
        // 🚚 CREATE DELIVERY RECORD FOR ADMIN DASHBOARD
        // Both card-paid and cash orders need a delivery record so admin can assign a driver
        ensureDeliveryRecordForOrder(savedOrder);

        // 🔔 NOTIFY PROVIDERS: send a notification to each shop owner whose products are in this order
        notifyProvidersForNewOrder(savedOrder, cartItems, user);
        
        return buildOrderResponse(savedOrder);
    }
    
    @Override
    @Transactional
    public OrderResponse confirmPayment(ObjectId userId, ObjectId orderId, String paymentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (!order.getUser().getId().toHexString().equals(userId.toHexString())) {
            throw new IllegalStateException("Order does not belong to user");
        }
        
        if (order.getPaymentStatus() == PaymentStatus.PAID) {
            // Already PAID (card orders are set PAID on creation) — just record the paymentId
            if (paymentId != null && !paymentId.isBlank()) {
                order.setPaymentId(paymentId);
                order.setLastUpdated(LocalDateTime.now());
                orderRepository.save(order);
            }
            log.info("✅ Payment already confirmed for order {} — paymentId recorded", orderId);
            return buildOrderResponse(order);
        }
        
        // CASH order reaching here: mark as PAID (delivery collected cash)
        order.setPaymentStatus(PaymentStatus.PAID);
        order.setPaymentId(paymentId);
        order.setPaidAt(LocalDateTime.now());
        order.setLastUpdated(LocalDateTime.now());
        
        Order updated = orderRepository.save(order);
        log.info("💰 Cash payment confirmed for order {}", orderId);
        return buildOrderResponse(updated);
    }
    
    @Override
    public List<OrderResponse> getUserOrders(ObjectId userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        System.out.println("🔍 ORDER SERVICE DEBUG - Getting orders for user: " + user.getEmail() + " (ID: " + userId + ")");
        
        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(user);
        System.out.println("🔍 ORDER SERVICE DEBUG - Found " + orders.size() + " orders in database");
        
        if (!orders.isEmpty()) {
            System.out.println("🔍 ORDER SERVICE DEBUG - First order: " + orders.get(0).getOrderNumber() + " - Status: " + orders.get(0).getStatus());
        }
        
        List<OrderResponse> responses = orders.stream()
                .map(this::buildOrderResponse)
                .collect(Collectors.toList());
        
        System.out.println("🔍 ORDER SERVICE DEBUG - Returning " + responses.size() + " order responses");
        return responses;
    }
    
    @Override
    public org.springframework.data.domain.Page<OrderResponse> getUserOrdersPaginated(ObjectId userId, org.springframework.data.domain.Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        log.info("🔍 PAGINATED ORDERS - Getting orders for user: {} (ID: {})", user.getEmail(), userId.toHexString());
        log.info("🔍 PAGINATED ORDERS - Page: {}, Size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        // Debug: Check total orders for this user
        List<Order> allUserOrders = orderRepository.findByUser(user);
        log.info("🔍 PAGINATED ORDERS - Total orders for user in DB: {}", allUserOrders.size());
        
        if (!allUserOrders.isEmpty()) {
            log.info("🔍 PAGINATED ORDERS - Sample order: {} | Status: {} | Created: {}", 
                    allUserOrders.get(0).getOrderNumber(),
                    allUserOrders.get(0).getStatus(),
                    allUserOrders.get(0).getCreatedAt());
        }
        
        org.springframework.data.domain.Page<Order> ordersPage = orderRepository.findByUser(user, pageable);
        
        log.info("🔍 PAGINATED ORDERS - Page results: {} orders (total elements: {}, total pages: {})", 
                ordersPage.getNumberOfElements(), ordersPage.getTotalElements(), ordersPage.getTotalPages());
        
        if (ordersPage.hasContent()) {
            Order firstOrder = ordersPage.getContent().get(0);
            log.info("🔍 PAGINATED ORDERS - First order in page: {} | Status: {}", 
                    firstOrder.getOrderNumber(), firstOrder.getStatus());
        }
        
        org.springframework.data.domain.Page<OrderResponse> responsePage = ordersPage.map(this::buildOrderResponse);
        
        log.info("🔍 PAGINATED ORDERS - Returning {} order responses", responsePage.getNumberOfElements());
        
        return responsePage;
    }
    
    @Override
    public OrderResponse getOrderById(ObjectId userId, ObjectId orderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Order does not belong to user");
        }
        
        return buildOrderResponse(order);
    }
    
    @Override
    public OrderResponse getOrderByNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        return buildOrderResponse(order);
    }
    
    @Override
    @Transactional
    public OrderResponse updateOrderStatus(ObjectId orderId, String statusStr) {
        return updateOrderStatus(orderId, statusStr, "SYSTEM");
    }
    
    /**
     * Update order status with actor validation
     * @param orderId Order ID
     * @param statusStr New status string
     * @param actor Who is making the change: PROVIDER, DELIVERY, CLIENT, SYSTEM, ADMIN
     * @return Updated order response
     */
    @Override
    @Transactional
    public OrderResponse updateOrderStatus(ObjectId orderId, String statusStr, String actor) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        OrderStatus newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        
        log.info("🔄 Order {} status change: {} → {} (by {})", 
                order.getOrderNumber(), order.getStatus(), newStatus, actor);
        
        // Validate transition
        orderStatusValidator.validateTransition(order, newStatus, actor);
        
        // Store old status for stock logic
        OrderStatus oldStatus = order.getStatus();
        boolean wasConfirmedOrLater = (oldStatus == OrderStatus.CONFIRMED || 
                                       oldStatus == OrderStatus.PREPARING || 
                                       oldStatus == OrderStatus.IN_TRANSIT);
        
        // Update status
        order.setStatus(newStatus);
        order.setLastUpdated(LocalDateTime.now());
        
        // Handle status-specific logic
        switch (newStatus) {
            case CONFIRMED:
                order.setConfirmedAt(LocalDateTime.now());
                // ✅ CRITICAL: Reduce stock when provider confirms order
                reduceStockForOrder(order);
                log.info("✅ Order {} confirmed by provider, stock reduced", order.getOrderNumber());
                
                // 🔔 NOTIFY CLIENT: Send notification to order client that order has been confirmed
                try {
                    User client = order.getUser();
                    String title = "✅ Order Confirmed";
                    String description = String.format(
                            "Your order %s has been confirmed by the provider. Your purchase is now being prepared for delivery.",
                            order.getOrderNumber()
                    );
                    notificationService.sendNotification(
                            client,
                            title,
                            description,
                            NotificationType.INTERNAL_NOTIFICATION,
                            order.getId().toHexString()
                    );
                    log.info("🔔 Client {} notified that order {} has been confirmed", client.getEmail(), order.getOrderNumber());
                } catch (Exception e) {
                    log.warn("Could not notify client for order confirmation {}: {}", order.getOrderNumber(), e.getMessage());
                }
                
                // Grant loyalty points for CARD payments (already paid)
                if (order.getPaymentStatus() == PaymentStatus.PAID) {
                    grantLoyaltyPointsForOrder(order);
                    log.info("🏆 Loyalty points granted for CARD payment order {}", order.getOrderNumber());
                }
                if (OrderDeliveryEligibility.isEligibleForDelivery(order)) {
                    ensureDeliveryRecordForOrder(order);
                }
                break;
                
            case PREPARING:
                order.setPreparingAt(LocalDateTime.now());
                log.info("📦 Order {} being prepared by delivery", order.getOrderNumber());
                break;
                
            case IN_TRANSIT:
                order.setDeliveryStartedAt(LocalDateTime.now());
                log.info("🚚 Order {} in transit", order.getOrderNumber());
                break;
                
            case DELIVERED:
                order.setDeliveredAt(LocalDateTime.now());
                
                // For Cash on Delivery, mark as PAID when delivered
                if (order.getPaymentStatus() == PaymentStatus.PENDING_PAYMENT &&
                    OrderDeliveryEligibility.isCashPaymentMethod(order.getPaymentMethod())) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                    order.setPaidAt(LocalDateTime.now());
                    
                    // Grant loyalty points for CASH payments (now paid)
                    grantLoyaltyPointsForOrder(order);
                    log.info("💰 Cash on Delivery payment completed for order {}, loyalty points granted", 
                            order.getOrderNumber());
                }
                log.info("📦 Order {} delivered successfully", order.getOrderNumber());
                break;
                
            case RETURNED:
                order.setReturnedAt(LocalDateTime.now());
                
                // ❌ DO NOT restore stock here - provider must verify and restock first
                // Stock will be restored when status changes to RESTOCKED
                
                // Deduct loyalty points if they were granted
                if (order.getPaymentStatus() == PaymentStatus.PAID) {
                    deductLoyaltyPointsForOrder(order);
                    log.info("🏆 Loyalty points deducted for returned order {}", order.getOrderNumber());
                }
                
                log.info("📦 Order {} marked as RETURNED, waiting for provider verification", 
                        order.getOrderNumber());
                break;
                
            case RESTOCKED:
                order.setRestockedAt(LocalDateTime.now());
                
                // ✅ CRITICAL: Restore stock when provider verifies and restocks
                if (wasConfirmedOrLater) {
                    restoreStockForOrder(order);
                    log.info("📦 Order {} restocked by provider, stock restored", order.getOrderNumber());
                }
                break;
                
            case CANCELLED:
                order.setCancelledAt(LocalDateTime.now());
                
                // ✅ CRITICAL: Restore stock when order is cancelled (only if was confirmed)
                if (wasConfirmedOrLater) {
                    restoreStockForOrder(order);
                    log.info("❌ Order {} cancelled, stock restored", order.getOrderNumber());
                }
                
                // Deduct loyalty points if they were granted
                if (order.getPaymentStatus() == PaymentStatus.PAID) {
                    deductLoyaltyPointsForOrder(order);
                    log.info("🏆 Loyalty points deducted for cancelled order {}", order.getOrderNumber());
                }
                break;
        }
        
        Order updated = orderRepository.save(order);
        return buildOrderResponse(updated);
    }
    
    /**
     * Provider confirms physical verification and restocking of returned order
     * Changes status to RESTOCKED which triggers stock restoration.
     * 
     * Works when order is RETURNED or CONFIRMED (delivery was returned but order
     * status was never updated — common with legacy deliveries).
     * Also handles PENDING orders (delivery returned before provider confirmed).
     */
    @Override
    @Transactional
    public OrderResponse confirmPickup(ObjectId orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        log.info("🔄 confirmPickup called for order {} with status {}", order.getOrderNumber(), order.getStatus());
        
        // Accept any non-final status — delivery was returned, provider is restocking
        if (order.getStatus() == OrderStatus.RESTOCKED) {
            throw new IllegalStateException(
                    String.format("Order %s is already RESTOCKED.", order.getOrderNumber()));
        }
        if (order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalStateException(
                    String.format("Order %s was already DELIVERED successfully — cannot restock.", order.getOrderNumber()));
        }
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException(
                    String.format("Order %s is CANCELLED — cannot restock.", order.getOrderNumber()));
        }
        
        // For RETURNED: normal path via updateOrderStatus (restores stock)
        if (order.getStatus() == OrderStatus.RETURNED) {
            log.info("📦 Order {} is RETURNED — restocking via normal path", order.getOrderNumber());
            return updateOrderStatus(orderId, "RESTOCKED", "PROVIDER");
        }
        
        // For CONFIRMED or PENDING: delivery was returned but order status was never updated
        // Restore stock only if order was CONFIRMED (stock was reduced at confirmation)
        boolean stockWasReduced = (order.getStatus() == OrderStatus.CONFIRMED ||
                                   order.getStatus() == OrderStatus.PREPARING ||
                                   order.getStatus() == OrderStatus.IN_TRANSIT);
        
        log.info("📦 Order {} has status {} — restocking directly (stockWasReduced={})",
                order.getOrderNumber(), order.getStatus(), stockWasReduced);
        
        order.setStatus(OrderStatus.RESTOCKED);
        order.setRestockedAt(LocalDateTime.now());
        order.setLastUpdated(LocalDateTime.now());
        
        if (stockWasReduced) {
            restoreStockForOrder(order);
            log.info("✅ Stock restored for order {}", order.getOrderNumber());
        } else {
            log.info("ℹ️ Stock was not reduced for order {} (was PENDING) — no restoration needed", order.getOrderNumber());
        }
        
        Order updated = orderRepository.save(order);
        return buildOrderResponse(updated);
    }
    
    /**
     * Reduce stock for order items
     */
    private void reduceStockForOrder(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            try {
                stockManagementService.reduceStock(item.getProductId(), item.getQuantity());
                log.info("✅ Reduced {} units of product {}", item.getQuantity(), item.getProductId());
            } catch (Exception e) {
                log.error("❌ Failed to reduce stock for product {}: {}", item.getProductId(), e.getMessage());
                throw new IllegalStateException("Failed to reduce stock for product " + item.getProductId(), e);
            }
        }
    }
    
    /**
     * Restore stock for cancelled or returned orders
     */
    private void restoreStockForOrder(Order order) {
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        for (OrderItem item : items) {
            try {
                stockManagementService.restoreStock(item.getProductId(), item.getQuantity());
                log.info("✅ Restored {} units of product {}", item.getQuantity(), item.getProductId());
            } catch (Exception e) {
                log.error("❌ Failed to restore stock for product {}: {}", item.getProductId(), e.getMessage());
            }
        }
    }
    
    /**
     * Grant loyalty points for order
     */
    private void grantLoyaltyPointsForOrder(Order order) {
        try {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            if (!items.isEmpty() && order.getFinalAmount() != null && order.getFinalAmount() > 0) {
                loyaltyCardService.addPointsForOrder(
                        order.getUser().getId(), 
                        items, 
                        order.getFinalAmount()
                );
            }
        } catch (Exception e) {
            log.error("❌ Failed to grant loyalty points for order {}: {}", 
                    order.getOrderNumber(), e.getMessage());
        }
    }
    
    /**
     * Deduct loyalty points for returned or cancelled orders
     */
    private void deductLoyaltyPointsForOrder(Order order) {
        try {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            if (!items.isEmpty() && order.getFinalAmount() != null && order.getFinalAmount() > 0) {
                int pointsToDeduct = loyaltyCardService.calculatePointsForOrder(
                        order.getUser().getId(), 
                        items, 
                        order.getFinalAmount()
                );
                loyaltyCardService.deductPoints(order.getUser().getId(), pointsToDeduct);
            }
        } catch (Exception e) {
            log.error("❌ Failed to deduct loyalty points for order {}: {}", 
                    order.getOrderNumber(), e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public OrderResponse confirmOrder(ObjectId userId, ObjectId orderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        // ✅ CRITICAL: Only providers can confirm orders
        // For now, we'll check if the user is the provider of any item in the order
        // In a real system, you'd check user role and product ownership
        
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only PENDING orders can be confirmed");
        }
        
        // ❌ IMPORTANT: Provider confirmation does NOT award loyalty points
        // Loyalty points are only awarded when payment is completed (confirmPayment method)
        
        // Update order status to CONFIRMED (provider accepted the order)
        order.setStatus(OrderStatus.CONFIRMED);
        order.setLastUpdated(LocalDateTime.now());
        Order updated = orderRepository.save(order);
        
        System.out.println("✅ PROVIDER CONFIRMATION - Order confirmed by provider, NO loyalty points awarded yet");
        
        return buildOrderResponse(updated);
    }
    
    @Override
    @Transactional
    public RefundSummaryDTO declineOrder(ObjectId userId, ObjectId orderId, CancelOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Order does not belong to user");
        }
        
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only PENDING or CONFIRMED orders can be cancelled");
        }
        
        // ✅ CRITICAL: Check 7-day cancellation window for clients
        if (!canClientCancelOrder(order)) {
            throw new IllegalStateException("Order cannot be cancelled after 7 days");
        }
        
        // Restore stock for all items
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            if (item.getStatus() == OrderItemStatus.ACTIVE) {
                stockManagementService.restoreStock(item.getProductId(), item.getQuantity());
                item.setStatus(OrderItemStatus.CANCELLED);
                item.setCancelledQuantity(item.getQuantity());
                orderItemRepository.save(item);
            }
        }
        
        // Update order status to CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(request != null ? request.getReason() : "Order cancelled by client");
        order.setCancelledAt(LocalDateTime.now());
        order.setLastUpdated(LocalDateTime.now());
        orderRepository.save(order);
        
        // Restore coupon usage if applicable
        if (order.getCouponCode() != null) {
            couponService.decrementCouponUsage(order.getCouponCode());
        }
        
        return RefundSummaryDTO.builder()
                .orderId(orderId.toHexString())
                .orderStatus(esprit_market.Enum.cartEnum.CartStatus.CANCELLED)  // Using CartStatus for now
                .originalTotal(order.getTotalAmount())
                .refundedAmount(order.getFinalAmount())
                .remainingTotal(0.0)
                .refundDate(LocalDateTime.now())
                .build();
    }
    
    /**
     * Check if client can cancel order (within 7 days of creation)
     */
    private boolean canClientCancelOrder(Order order) {
        // Can cancel PENDING or CONFIRMED orders (but not CANCELLED)
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            System.out.println("🔍 ORDER SERVICE DEBUG - Cannot cancel: status is " + order.getStatus() + " (only PENDING/CONFIRMED allowed)");
            return false;
        }
        
        LocalDateTime orderDate = order.getCreatedAt();
        LocalDateTime sevenDaysLater = orderDate.plusDays(7);
        LocalDateTime now = LocalDateTime.now();
        
        System.out.println("🔍 ORDER SERVICE DEBUG - Order date: " + orderDate);
        System.out.println("🔍 ORDER SERVICE DEBUG - Seven days later: " + sevenDaysLater);
        System.out.println("🔍 ORDER SERVICE DEBUG - Now: " + now);
        System.out.println("🔍 ORDER SERVICE DEBUG - Is before 7 days: " + now.isBefore(sevenDaysLater));
        
        return now.isBefore(sevenDaysLater);
    }
    
    @Override
    @Transactional
    public RefundSummaryDTO cancelOrder(ObjectId userId, ObjectId orderId, CancelOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Order does not belong to user");
        }
        
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Order is already cancelled");
        }
        
        // Restore stock for all items
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            if (item.getStatus() == OrderItemStatus.ACTIVE) {
                stockManagementService.restoreStock(item.getProductId(), item.getQuantity());
                item.setStatus(OrderItemStatus.CANCELLED);
                item.setCancelledQuantity(item.getQuantity());
                orderItemRepository.save(item);
            }
        }
        
        // Update order status
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(request != null ? request.getReason() : "User cancelled");
        order.setCancelledAt(LocalDateTime.now());
        order.setLastUpdated(LocalDateTime.now());
        orderRepository.save(order);
        
        // Restore coupon usage
        if (order.getCouponCode() != null) {
            couponService.decrementCouponUsage(order.getCouponCode());
        }
        
        // Deduct loyalty points if they were added (only for CONFIRMED orders)
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            int pointsToDeduct = loyaltyCardService.calculatePointsForOrder(userId, items, order.getFinalAmount());
            loyaltyCardService.deductPoints(userId, pointsToDeduct);
        }
        
        return RefundSummaryDTO.builder()
                .orderId(orderId.toHexString())
                .orderStatus(esprit_market.Enum.cartEnum.CartStatus.CANCELLED)  // Using CartStatus for now
                .originalTotal(order.getTotalAmount())
                .refundedAmount(order.getFinalAmount())
                .remainingTotal(0.0)
                .refundDate(LocalDateTime.now())
                .build();
    }
    
    @Override
    @Transactional
    public RefundSummaryDTO cancelOrderItem(ObjectId userId, ObjectId orderId, CancelOrderItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Order does not belong to user");
        }
        
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Order is already cancelled");
        }
        
        // Find the order item to cancel
        ObjectId itemId = new ObjectId(request.getCartItemId());  // Note: DTO still uses "cartItemId" for backward compatibility
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found"));
        
        if (!item.getOrderId().equals(orderId)) {
            throw new IllegalStateException("Item does not belong to this order");
        }
        
        if (item.getStatus() != OrderItemStatus.ACTIVE) {
            throw new IllegalStateException("Item is not active");
        }
        
        int quantityToCancel = request.getQuantityToCancel() != null ? request.getQuantityToCancel() : item.getQuantity();
        
        if (quantityToCancel > item.getQuantity()) {
            throw new IllegalArgumentException("Cannot cancel more than ordered quantity");
        }
        
        // Restore stock
        stockManagementService.restoreStock(item.getProductId(), quantityToCancel);
        
        // Calculate refund amount
        double refundAmount = (item.getProductPrice() * quantityToCancel);
        
        // Update item status
        if (quantityToCancel == item.getQuantity()) {
            item.setStatus(OrderItemStatus.CANCELLED);
            item.setCancelledQuantity(quantityToCancel);
        } else {
            item.setStatus(OrderItemStatus.PARTIALLY_CANCELLED);
            item.setCancelledQuantity((item.getCancelledQuantity() != null ? item.getCancelledQuantity() : 0) + quantityToCancel);
        }
        item.setRefundedAmount((item.getRefundedAmount() != null ? item.getRefundedAmount() : 0.0) + refundAmount);
        orderItemRepository.save(item);
        
        // Update order status if all items are cancelled
        List<OrderItem> allItems = orderItemRepository.findByOrderId(orderId);
        boolean allCancelled = allItems.stream()
                .allMatch(i -> i.getStatus() == OrderItemStatus.CANCELLED);
        
        if (allCancelled) {
            order.setStatus(OrderStatus.CANCELLED);
        } else {
            // Keep as PENDING since we only have 3 statuses now
            order.setStatus(OrderStatus.PENDING);
        }
        
        order.setLastUpdated(LocalDateTime.now());
        orderRepository.save(order);
        
        // Deduct loyalty points proportionally (only for CONFIRMED orders)
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            // Calculate points for the cancelled item only
            OrderItem cancelledItem = OrderItem.builder()
                    .productPrice(item.getProductPrice())
                    .quantity(quantityToCancel)
                    .build();
            int pointsToDeduct = loyaltyCardService.calculatePointsForOrder(
                    userId, 
                    List.of(cancelledItem), 
                    refundAmount
            );
            loyaltyCardService.deductPoints(userId, pointsToDeduct);
        }
        
        return RefundSummaryDTO.builder()
                .orderId(orderId.toHexString())
                .orderStatus(esprit_market.Enum.cartEnum.CartStatus.PARTIALLY_CANCELLED)
                .originalTotal(order.getTotalAmount())
                .refundedAmount(refundAmount)
                .remainingTotal(order.getFinalAmount() - refundAmount)
                .refundDate(LocalDateTime.now())
                .build();
    }
    
    @Override
    public RefundSummaryDTO getRefundSummary(ObjectId userId, ObjectId orderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Order does not belong to user");
        }
        
        // Calculate total refunded amount
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        double totalRefunded = items.stream()
                .filter(item -> item.getRefundedAmount() != null)
                .mapToDouble(OrderItem::getRefundedAmount)
                .sum();
        
        double remainingTotal = order.getFinalAmount() - totalRefunded;
        
        // Build refunded items list
        List<RefundSummaryDTO.RefundedItemDTO> refundedItems = items.stream()
                .filter(item -> item.getStatus() != OrderItemStatus.ACTIVE)
                .map(item -> RefundSummaryDTO.RefundedItemDTO.builder()
                        .cartItemId(item.getId().toHexString())
                        .productName(item.getProductName())
                        .cancelledQuantity(item.getCancelledQuantity())
                        .refundAmount(item.getRefundedAmount())
                        .status(esprit_market.Enum.cartEnum.CartItemStatus.valueOf(item.getStatus().name()))
                        .build())
                .collect(Collectors.toList());
        
        return RefundSummaryDTO.builder()
                .orderId(orderId.toHexString())
                .orderStatus(esprit_market.Enum.cartEnum.CartStatus.valueOf(order.getStatus().name()))
                .originalTotal(order.getTotalAmount())
                .refundedAmount(totalRefunded)
                .remainingTotal(remainingTotal)
                .refundedItems(refundedItems)
                .refundDate(order.getCancelledAt())
                .build();
    }
    
    @Override
    public OrderResponse getOrderByIdAdmin(ObjectId orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        return buildOrderResponse(order);
    }
    
    @Override
    public List<OrderResponse> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        return orders.stream()
                .map(this::buildOrderResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<OrderResponse> getOrdersByStatus(String statusStr) {
        OrderStatus status = OrderStatus.valueOf(statusStr.toUpperCase());
        List<Order> orders = orderRepository.findByStatus(status);
        return orders.stream()
                .map(this::buildOrderResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public boolean canClientCancelOrder(ObjectId orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        System.out.println("🔍 ORDER SERVICE DEBUG - Checking cancel permission for order: " + orderId);
        System.out.println("🔍 ORDER SERVICE DEBUG - Order status: " + order.getStatus());
        System.out.println("🔍 ORDER SERVICE DEBUG - Order created at: " + order.getCreatedAt());
        
        boolean result = canClientCancelOrder(order);
        System.out.println("🔍 ORDER SERVICE DEBUG - Can cancel result: " + result);
        
        return result;
    }
    
    // Helper methods
    
    private OrderResponse buildOrderResponse(Order order) {
        // ✅ CRITICAL: Normalize legacy status values for backward compatibility
        order = normalizeLegacyStatus(order);
        if (OrderDeliveryEligibility.isEligibleForDelivery(order)) {
            ensureDeliveryRecordForOrder(order);
        }
        
        OrderResponse response = orderMapper.toResponse(order);
        Delivery delivery = ensureDeliveryCodeForOrderResponse(order);
        if (delivery != null) {
            response.setDeliveryId(delivery.getId() != null ? delivery.getId().toHexString() : null);
            response.setDeliveryStatus(delivery.getStatus());
            response.setDeliveryConfirmationCode(delivery.getDeliveryConfirmationCode());
        }
        
        // Load order items
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<OrderItemResponse> itemResponses = items.stream()
                .map(orderItemMapper::toResponse)
                .collect(Collectors.toList());
        
        response.setItems(itemResponses);
        return response;
    }
    
    /**
     * Normalize legacy order statuses to current status system.
     * This ensures backward compatibility with old MongoDB data.
     * 
     * Legacy mappings:
     * - PAID → PENDING (payment status, not order status - needs provider confirmation)
     * - ACCEPTED → CONFIRMED
     * - PROCESSING → PREPARING
     * - DECLINED → CANCELLED
     * - SHIPPED → IN_TRANSIT
     * - OUT_FOR_DELIVERY → IN_TRANSIT
     */
    private Order normalizeLegacyStatus(Order order) {
        if (order.getStatus() == null) {
            log.warn("⚠️  Order {} has null status, defaulting to PENDING", order.getOrderNumber());
            order.setStatus(OrderStatus.PENDING);
            return order;
        }
        
        OrderStatus currentStatus = order.getStatus();
        OrderStatus normalizedStatus = null;
        
        switch (currentStatus) {
            case PAID:
                normalizedStatus = OrderStatus.PENDING;
                // Also ensure paymentStatus is PAID
                if (order.getPaymentStatus() != PaymentStatus.PAID) {
                    order.setPaymentStatus(PaymentStatus.PAID);
                }
                log.info("🔄 Normalizing legacy status PAID → PENDING for order {}", order.getOrderNumber());
                break;
            case ACCEPTED:
                normalizedStatus = OrderStatus.CONFIRMED;
                log.info("🔄 Normalizing legacy status ACCEPTED → CONFIRMED for order {}", order.getOrderNumber());
                break;
            case PROCESSING:
                normalizedStatus = OrderStatus.PREPARING;
                log.info("🔄 Normalizing legacy status PROCESSING → PREPARING for order {}", order.getOrderNumber());
                break;
            case DECLINED:
                normalizedStatus = OrderStatus.CANCELLED;
                log.info("🔄 Normalizing legacy status DECLINED → CANCELLED for order {}", order.getOrderNumber());
                break;
            case SHIPPED:
            case OUT_FOR_DELIVERY:
                normalizedStatus = OrderStatus.IN_TRANSIT;
                log.info("🔄 Normalizing legacy status {} → IN_TRANSIT for order {}", currentStatus, order.getOrderNumber());
                break;
            default:
                // Status is already current, no normalization needed
                return order;
        }
        
        // Update the order with normalized status
        if (normalizedStatus != null) {
            order.setStatus(normalizedStatus);
            // Persist the normalized status to database
            orderRepository.save(order);
            log.info("✅ Persisted normalized status {} for order {}", normalizedStatus, order.getOrderNumber());
        }
        
        return order;
    }
    
    private String generateOrderNumber() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = orderRepository.count() + 1;
        return String.format("ORD-%s-%04d", datePart, count);
    }

    @Autowired
    private MongoTemplate mongoTemplate;

    public List<CancelledOrderStatsDTO> getCancelledOrdersStats() {

        Aggregation aggregation = Aggregation.newAggregation(

                // join order_items
                Aggregation.lookup("orderItem", "_id", "orderId", "items"),

                // join user
                Aggregation.lookup("user", "user.$id", "_id", "userDetails"),

                Aggregation.unwind("items"),
                Aggregation.unwind("userDetails"),

                // filter cancelled orders
                Aggregation.match(
                        Criteria.where("status").is("CANCELLED")
                ),

                Aggregation.project()
                        .and("_id").as("orderId")
                        .and("orderNumber").as("orderNumber")
                        .and("userDetails.email").as("userEmail")
                        .and("items.productName").as("productName")
                        .and("items.quantity").as("quantity")
                        .and("items.shopId").as("shopId")
                        .and("finalAmount").as("totalAmount")
        );

        return mongoTemplate.aggregate(aggregation, "order", CancelledOrderStatsDTO.class)
                .getMappedResults();
    }

    @Override
    public List<CartItemResponse> getPurchasedItemsForUser(ObjectId userId) {
        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // Get all completed orders for the user (CONFIRMED or with PAID payment status)
        List<Order> orders = orderRepository.findByUser(user).stream()
                .filter(o -> o.getStatus() == OrderStatus.CONFIRMED || 
                            o.getStatus() == OrderStatus.DELIVERED ||
                            o.getPaymentStatus() == PaymentStatus.PAID)
                .collect(Collectors.toList());
        
        // Collect all order items from these orders
        List<CartItemResponse> purchasedItems = orders.stream()
                .flatMap(order -> orderItemRepository.findByOrderId(order.getId()).stream())
                .map(orderItem -> {
                    CartItemResponse response = new CartItemResponse();
                    response.setId(orderItem.getId().toString());
                    response.setProductId(orderItem.getProductId().toString());
                    response.setProductName(orderItem.getProductName());
                    response.setQuantity(orderItem.getQuantity());
                    response.setUnitPrice(orderItem.getProductPrice());
                    return response;
                })
                .collect(Collectors.toList());
        
        return purchasedItems;
    }
}
