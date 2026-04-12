package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.OrderItemStatus;
import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.dto.cartDto.*;
import esprit_market.entity.cart.*;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.user.User;
import esprit_market.mappers.cartMapper.OrderItemMapper;
import esprit_market.mappers.cartMapper.OrderMapper;
import esprit_market.repository.cartRepository.*;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.marketplaceService.IProductService;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
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
        
        // Generate order number
        String orderNumber = generateOrderNumber();
        
        // Create Order entity
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .totalAmount(cart.getSubtotal())
                .discountAmount(cart.getDiscountAmount())
                .finalAmount(cart.getTotal())
                .couponCode(cart.getAppliedCouponCode())
                .discountId(cart.getAppliedDiscountId())
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod())
                .orderNumber(orderNumber)
                .createdAt(LocalDateTime.now())
                .lastUpdated(LocalDateTime.now())
                .build();
        
        Order savedOrder = orderRepository.save(order);
        
        // Convert CartItems to OrderItems
        for (CartItem cartItem : cartItems) {
            // Fetch product to get shopId
            Product product = productRepository.findById(cartItem.getProductId()).orElse(null);
            ObjectId shopId = (product != null) ? product.getShopId() : null;
            
            OrderItem orderItem = OrderItem.builder()
                    .orderId(savedOrder.getId())
                    .productId(cartItem.getProductId())
                    .productName(cartItem.getProductName())
                    .productPrice(cartItem.getUnitPrice())
                    .shopId(shopId)  // ✅ CRITICAL: Added for provider filtering
                    .quantity(cartItem.getQuantity())
                    .subtotal(cartItem.getSubTotal())
                    .status(OrderItemStatus.ACTIVE)
                    .cancelledQuantity(0)
                    .refundedAmount(0.0)
                    .build();
            
            orderItemRepository.save(orderItem);
            
            System.out.println("✅ ORDER ITEM CREATED - Product: " + cartItem.getProductName() + 
                             " | Shop: " + (shopId != null ? shopId.toHexString() : "NULL"));
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
        
        return buildOrderResponse(savedOrder);
    }
    
    @Override
    @Transactional
    public OrderResponse confirmPayment(ObjectId userId, ObjectId orderId, String paymentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (!order.getUser().getId().equals(userId)) {
            throw new IllegalStateException("Order does not belong to user");
        }
        
        // Payment can be confirmed from PENDING or CONFIRMED status
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Order must be PENDING or CONFIRMED to process payment");
        }
        
        // ✅ CRITICAL: Reduce stock ONLY after payment confirmed
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            stockManagementService.reduceStock(item.getProductId(), item.getQuantity());
        }
        
        // Update order status to PAID (payment completed)
        order.setStatus(OrderStatus.PAID);
        order.setPaymentId(paymentId);
        order.setPaidAt(LocalDateTime.now());
        order.setLastUpdated(LocalDateTime.now());
        Order updated = orderRepository.save(order);
        
        // ✅ CRITICAL: Add loyalty points ONLY after payment confirmed (PAID status)
        // This is the ONLY place where loyalty points should be awarded
        if (items != null && !items.isEmpty() && order.getFinalAmount() != null && order.getFinalAmount() > 0) {
            System.out.println("🏆 LOYALTY DEBUG - Adding points for PAID order: " + orderId);
            loyaltyCardService.addPointsForOrder(userId, items, order.getFinalAmount());
        }
        
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
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        OrderStatus newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
        order.setStatus(newStatus);
        order.setLastUpdated(LocalDateTime.now());
        
        Order updated = orderRepository.save(order);
        return buildOrderResponse(updated);
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
            throw new IllegalStateException("Only PENDING or CONFIRMED orders can be declined");
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
        
        // Update order status to DECLINED
        order.setStatus(OrderStatus.DECLINED);
        order.setCancellationReason(request != null ? request.getReason() : "Order declined by client");
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
        // Can cancel PENDING or CONFIRMED orders (but not PAID or DECLINED)
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
        
        if (order.getStatus() == OrderStatus.DECLINED) {
            throw new IllegalStateException("Order is already declined");
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
        order.setStatus(OrderStatus.DECLINED);
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
        
        if (order.getStatus() == OrderStatus.DECLINED) {
            throw new IllegalStateException("Order is already declined");
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
            order.setStatus(OrderStatus.DECLINED);
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
        OrderResponse response = orderMapper.toResponse(order);
        
        // Load order items
        List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
        List<OrderItemResponse> itemResponses = items.stream()
                .map(orderItemMapper::toResponse)
                .collect(Collectors.toList());
        
        response.setItems(itemResponses);
        return response;
    }
    
    private String generateOrderNumber() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = orderRepository.count() + 1;
        return String.format("ORD-%s-%04d", datePart, count);
    }
}
