package esprit_market.controller.cartController;

import esprit_market.dto.cartDto.*;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.AuthHelperService;
import esprit_market.service.cartService.IOrderService;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

/**
 * OrderController handles all order-related operations.
 * 
 * This controller is separate from CartController to maintain
 * clear separation between shopping cart and order management.
 */
@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
// ✅ TEMPORARILY REMOVE PreAuthorize to test order logic
// @PreAuthorize("hasRole('CLIENT')")
public class OrderController {
    
    private final IOrderService orderService;
    private final AuthHelperService authHelper;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    
    private ObjectId getUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalStateException("User not authenticated");
        }
        
        // Get user by email from authentication
        String userEmail = authentication.getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
        
        System.out.println("🔍 ORDER DEBUG - Found user: " + user.getEmail() + " with ID: " + user.getId());
        return user.getId();
    }
    
    // ==================== CREATE ORDER ====================
    
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {
        
        try {
            ObjectId userId = getUserId(authentication);
            OrderResponse order = orderService.createOrderFromCart(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(order);
        } catch (Exception e) {
            System.err.println("❌ ORDER DEBUG - createOrder error: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    // ==================== PAYMENT CONFIRMATION ====================
    
    @PostMapping("/{orderId}/confirm-payment")
    public ResponseEntity<OrderResponse> confirmPayment(
            @PathVariable String orderId,
            @RequestParam String paymentId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        OrderResponse order = orderService.confirmPayment(userId, new ObjectId(orderId), paymentId);
        return ResponseEntity.ok(order);
    }
    
    // ==================== GET ORDERS ====================
    
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {
        try {
            ObjectId userId = getUserId(authentication);
            System.out.println("🔍 ORDER DEBUG - Getting orders for user ID: " + userId);
            
            // Debug: Check total orders in database
            long totalOrders = orderRepository.count();
            System.out.println("🔍 ORDER DEBUG - Total orders in database: " + totalOrders);
            
            List<OrderResponse> orders = orderService.getUserOrders(userId);
            System.out.println("🔍 ORDER DEBUG - Found " + orders.size() + " orders for user");
            
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("❌ ORDER DEBUG - getMyOrders error: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    @GetMapping("/paginated")
    public ResponseEntity<org.springframework.data.domain.Page<OrderResponse>> getMyOrdersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        log.info("Getting paginated orders for user: {} - page: {}, size: {}", userId, page, size);
        
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(
                page, 
                size, 
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")
        );
        
        org.springframework.data.domain.Page<OrderResponse> ordersPage = orderService.getUserOrdersPaginated(userId, pageable);
        
        return ResponseEntity.ok(ordersPage);
    }
    
    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable String orderId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        OrderResponse order = orderService.getOrderById(userId, new ObjectId(orderId));
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<OrderResponse> getOrderByNumber(
            @PathVariable String orderNumber) {
        
        OrderResponse order = orderService.getOrderByNumber(orderNumber);
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/{orderId}/can-cancel")
    public ResponseEntity<Boolean> canCancelOrder(
            @PathVariable String orderId,
            Authentication authentication) {
        
        try {
            ObjectId userId = getUserId(authentication);
            System.out.println("🔍 ORDER DEBUG - Checking cancel permission for order: " + orderId + " by user: " + userId);
            
            boolean canCancel = orderService.canClientCancelOrder(new ObjectId(orderId));
            System.out.println("🔍 ORDER DEBUG - Can cancel result: " + canCancel);
            
            return ResponseEntity.ok(canCancel);
        } catch (Exception e) {
            System.err.println("❌ ORDER DEBUG - Error checking cancel permission: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(false);
        }
    }
    
    // ==================== ORDER CONFIRMATION & DECLINE ====================
    
    @PostMapping("/{orderId}/confirm")
    public ResponseEntity<OrderResponse> confirmOrder(
            @PathVariable String orderId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        OrderResponse order = orderService.confirmOrder(userId, new ObjectId(orderId));
        return ResponseEntity.ok(order);
    }
    
    @PostMapping("/{orderId}/decline")
    public ResponseEntity<RefundSummaryDTO> declineOrder(
            @PathVariable String orderId,
            @RequestBody(required = false) CancelOrderRequest request,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        RefundSummaryDTO refund = orderService.declineOrder(userId, new ObjectId(orderId), request);
        return ResponseEntity.ok(refund);
    }
    
    // ==================== CANCELLATION & REFUND ====================
    
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<RefundSummaryDTO> cancelOrder(
            @PathVariable String orderId,
            @RequestBody(required = false) CancelOrderRequest request,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        RefundSummaryDTO refund = orderService.cancelOrder(userId, new ObjectId(orderId), request);
        return ResponseEntity.ok(refund);
    }
    
    @PostMapping("/{orderId}/cancel-item")
    public ResponseEntity<RefundSummaryDTO> cancelOrderItem(
            @PathVariable String orderId,
            @Valid @RequestBody CancelOrderItemRequest request,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        RefundSummaryDTO refund = orderService.cancelOrderItem(userId, new ObjectId(orderId), request);
        return ResponseEntity.ok(refund);
    }
    
    @GetMapping("/{orderId}/refund-summary")
    public ResponseEntity<RefundSummaryDTO> getRefundSummary(
            @PathVariable String orderId,
            Authentication authentication) {
        
        ObjectId userId = getUserId(authentication);
        RefundSummaryDTO summary = orderService.getRefundSummary(userId, new ObjectId(orderId));
        return ResponseEntity.ok(summary);
    }
    
    // ==================== DEBUG ENDPOINTS ====================
    
    @GetMapping("/debug/all")
    public ResponseEntity<String> debugAllOrders() {
        try {
            long totalOrders = orderRepository.count();
            List<OrderResponse> allOrders = orderService.getAllOrders();
            
            StringBuilder debug = new StringBuilder();
            debug.append("Total orders in database: ").append(totalOrders).append("\n");
            debug.append("Orders found by service: ").append(allOrders.size()).append("\n");
            
            for (OrderResponse order : allOrders) {
                debug.append("Order: ").append(order.getOrderNumber())
                     .append(" - User: ").append(order.getUserEmail())
                     .append(" - Status: ").append(order.getStatus()).append("\n");
            }
            
            return ResponseEntity.ok(debug.toString());
        } catch (Exception e) {
            return ResponseEntity.ok("Error: " + e.getMessage());
        }
    }
    
    @PostMapping("/debug/create-test-order")
    public ResponseEntity<String> createTestOrder(Authentication authentication) {
        try {
            ObjectId userId = getUserId(authentication);
            User user = userRepository.findById(userId).orElseThrow();
            
            // Create a simple test order
            CreateOrderRequest request = new CreateOrderRequest();
            request.setShippingAddress("Test Address 123");
            request.setPaymentMethod("CREDIT_CARD");
            
            OrderResponse order = orderService.createOrderFromCart(userId, request);
            return ResponseEntity.ok("Test order created: " + order.getOrderNumber());
        } catch (Exception e) {
            return ResponseEntity.ok("Error creating test order: " + e.getMessage());
        }
    }
    
    // ==================== ADMIN OPERATIONS ====================
    
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderResponse>> getAllOrders() {
        List<OrderResponse> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }
    
    @GetMapping("/admin/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderResponse>> getOrdersByStatus(@PathVariable String status) {
        List<OrderResponse> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }
    
    @PutMapping("/admin/{orderId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable String orderId,
            @RequestParam String status) {
        
        OrderResponse order = orderService.updateOrderStatus(new ObjectId(orderId), status);
        return ResponseEntity.ok(order);
    }
}
