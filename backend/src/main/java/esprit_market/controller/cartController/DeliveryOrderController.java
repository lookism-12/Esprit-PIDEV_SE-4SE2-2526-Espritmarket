package esprit_market.controller.cartController;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.Enum.cartEnum.PaymentStatus;
import esprit_market.dto.cartDto.OrderResponse;
import esprit_market.entity.cart.Order;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.service.cartService.IOrderService;
import esprit_market.service.cartService.OrderDeliveryEligibility;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Stream;

/**
 * Delivery Order Controller
 * 
 * NEW WORKFLOW (Simplified):
 * - Delivery sees card-payment orders immediately
 * - Delivery sees cash-on-delivery orders after provider confirmation
 * - Delivery marks orders as DELIVERED (CONFIRMED → DELIVERED)
 * - For CASH orders: Delivery collects payment (PENDING_PAYMENT → PAID)
 * 
 * STRICT RULES:
 * - Can only deliver orders with status = CONFIRMED
 * - For CASH orders: Must collect payment before marking delivered
 * 
 * NOTE: Return workflow is handled by DeliveryController (SAV module)
 * - Driver marks Delivery as RETURNED (not Order)
 * - Provider queries deliveries by status = RETURNED
 * - Provider verifies and restocks through Order workflow
 */
@Slf4j
@RestController
@RequestMapping("/api/delivery/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DELIVERY') or hasRole('ADMIN')")
public class DeliveryOrderController {
    
    private final OrderRepository orderRepository;
    private final IOrderService orderService;
    
    /**
     * Mark order as delivered
     * CONFIRMED → DELIVERED
     * 
     * For Cash on Delivery orders, this also marks payment as PAID
     */
    @PostMapping("/{orderId}/deliver")
    public ResponseEntity<OrderResponse> markAsDelivered(@PathVariable String orderId) {
        try {
            Order order = orderRepository.findById(new ObjectId(orderId))
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            // Validate order is CONFIRMED
            if (order.getStatus() != OrderStatus.CONFIRMED) {
                throw new IllegalStateException(
                    "Can only deliver orders with status CONFIRMED. Current status: " + order.getStatus()
                );
            }
            
            log.info("📦 Marking order as delivered: {}", order.getOrderNumber());
            
            // Update status with DELIVERY actor
            OrderResponse response = orderService.updateOrderStatus(
                order.getId(), 
                OrderStatus.DELIVERED.name(), 
                "DELIVERY"
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to mark order as delivered: {}", e.getMessage());
            throw new RuntimeException("Failed to mark order as delivered: " + e.getMessage());
        }
    }

    /**
     * Collect payment for Cash on Delivery order
     * PENDING_PAYMENT → PAID
     * 
     * This should be called BEFORE marking as delivered for CASH orders
     */
    @PostMapping("/{orderId}/collect-payment")
    public ResponseEntity<OrderResponse> collectPayment(@PathVariable String orderId) {
        try {
            Order order = orderRepository.findById(new ObjectId(orderId))
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            
            // Validate order is CONFIRMED
            if (order.getStatus() != OrderStatus.CONFIRMED) {
                throw new IllegalStateException(
                    "Can only collect payment for CONFIRMED orders. Current status: " + order.getStatus()
                );
            }
            
            // Validate payment is pending
            if (order.getPaymentStatus() != PaymentStatus.PENDING_PAYMENT) {
                throw new IllegalStateException(
                    "Payment already collected or not applicable. Payment status: " + order.getPaymentStatus()
                );
            }
            
            log.info("💵 Collecting payment for order: {}", order.getOrderNumber());
            
            // Use confirmPayment to handle stock reduction and loyalty points
            OrderResponse response = orderService.confirmPayment(
                order.getUser().getId(),
                order.getId(),
                "CASH_COLLECTED_BY_DELIVERY"
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to collect payment: {}", e.getMessage());
            throw new RuntimeException("Failed to collect payment: " + e.getMessage());
        }
    }
    
    /**
     * Get all orders eligible for delivery.
     */
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableOrders() {
        try {
            var cardOrders = orderRepository.findByPaymentMethodIn(
                    OrderDeliveryEligibility.cardPaymentMethods()
            );
            var confirmedCashOrders = orderRepository.findByPaymentMethodInAndStatus(
                    OrderDeliveryEligibility.cashPaymentMethods(),
                    OrderStatus.CONFIRMED
            );

            var orders = Stream.concat(cardOrders.stream(), confirmedCashOrders.stream())
                    .distinct()
                    .map(order -> orderService.getOrderByIdAdmin(order.getId()))
                    .toList();
            
            log.info("📋 Found {} orders available for delivery", orders.size());
            
            return ResponseEntity.ok(orders);
            
        } catch (Exception e) {
            log.error("❌ Failed to get available orders: {}", e.getMessage());
            throw new RuntimeException("Failed to get available orders: " + e.getMessage());
        }
    }
    
    /**
     * Get all orders with pending payment (CASH orders)
     */
    @GetMapping("/pending-payment")
    public ResponseEntity<?> getPendingPaymentOrders() {
        try {
            // Find all CONFIRMED orders with PENDING_PAYMENT status
            var orders = orderRepository.findAll().stream()
                    .filter(o -> o.getStatus() == OrderStatus.CONFIRMED)
                    .filter(o -> o.getPaymentStatus() == PaymentStatus.PENDING_PAYMENT)
                    .map(order -> orderService.getOrderByIdAdmin(order.getId()))
                    .toList();
            
            log.info("💵 Found {} orders with pending payment", orders.size());
            
            return ResponseEntity.ok(orders);
            
        } catch (Exception e) {
            log.error("❌ Failed to get pending payment orders: {}", e.getMessage());
            throw new RuntimeException("Failed to get pending payment orders: " + e.getMessage());
        }
    }
}
