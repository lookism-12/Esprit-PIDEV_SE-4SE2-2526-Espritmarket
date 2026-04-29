package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.entity.cart.Order;
import esprit_market.repository.cartRepository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Auto-cancellation service for orders.
 * 
 * BUSINESS RULE:
 * - If provider does not respond within 48 hours, order is auto-cancelled
 * - Only applies to orders with status = PENDING
 * - Stock is restored when order is cancelled
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderAutoCancellationService {
    
    private final OrderRepository orderRepository;
    private final OrderServiceImpl orderService;
    private final OrderStatusValidator orderStatusValidator;
    
    /**
     * Run every hour to check for orders that should be auto-cancelled
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour at minute 0
    @Transactional
    public void autoCancelExpiredOrders() {
        log.info("🔍 Checking for orders to auto-cancel...");
        
        try {
            // Find all PENDING orders
            List<Order> pendingOrders = orderRepository.findAll().stream()
                    .filter(o -> o.getStatus() == OrderStatus.PENDING)
                    .toList();
            
            log.info("Found {} pending orders", pendingOrders.size());
            
            int cancelledCount = 0;
            
            for (Order order : pendingOrders) {
                if (orderStatusValidator.shouldAutoCancelOrder(order)) {
                    try {
                        log.info("⏰ Auto-cancelling order {} (48h timeout)", order.getOrderNumber());
                        
                        // Set cancellation reason
                        order.setCancellationReason("Auto-cancelled: Provider did not respond within 48 hours");
                        orderRepository.save(order);
                        
                        // Update status with SYSTEM actor
                        orderService.updateOrderStatus(
                            order.getId(), 
                            OrderStatus.CANCELLED.name(), 
                            "SYSTEM"
                        );
                        
                        cancelledCount++;
                        
                    } catch (Exception e) {
                        log.error("❌ Failed to auto-cancel order {}: {}", 
                                order.getOrderNumber(), e.getMessage());
                    }
                }
            }
            
            if (cancelledCount > 0) {
                log.info("✅ Auto-cancelled {} orders", cancelledCount);
            } else {
                log.info("✅ No orders to auto-cancel");
            }
            
        } catch (Exception e) {
            log.error("❌ Error in auto-cancellation job: {}", e.getMessage(), e);
        }
    }
}
