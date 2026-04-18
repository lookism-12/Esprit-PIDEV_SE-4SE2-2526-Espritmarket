package esprit_market.scheduler;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.dto.cartDto.OrderItemResponse;
import esprit_market.dto.cartDto.OrderResponse;
import esprit_market.entity.cart.Order;
import esprit_market.entity.cart.OrderItem;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.service.cartService.StockManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderScheduler {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final StockManagementService stockManagementService;

    @Scheduled(cron = "0 0 * * * *") // runs every hour
    public void cancelUnpaidOrdersAfter24h() {

        LocalDateTime limitTime = LocalDateTime.now().minusHours(24);

        List<Order> expiredOrders = orderRepository
                .findByStatusAndCreatedAtBefore(OrderStatus.PENDING, limitTime);

        if (expiredOrders.isEmpty()) {
            log.info("✅ No expired orders found.");
            return;
        }

        for (Order order : expiredOrders) {

            log.info("⏰ AUTO-CANCEL AFTER 24H: {}", order.getOrderNumber());

            // 🔄 Restore stock
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());

            for (OrderItem item : items) {
                stockManagementService.restoreStock(
                        item.getProductId(),
                        item.getQuantity()
                );
            }

            // ❌ Update order
            order.setStatus(OrderStatus.DECLINED);
            order.setLastUpdated(LocalDateTime.now());

            Order updatedOrder = orderRepository.save(order);

            // ✅ Convert to DTO
            OrderResponse response = mapToOrderResponse(updatedOrder, items);

            // ✅ Structured logging
            log.info("📦 CANCELLED ORDER DTO → {}", response);
        }
    }

    // ✅ DTO Mapping
    private OrderResponse mapToOrderResponse(Order order, List<OrderItem> items) {

        List<OrderItemResponse> itemResponses = items.stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId().toHexString())
                        .orderId(item.getOrderId().toHexString())
                        .productId(item.getProductId().toHexString())
                        .productName(item.getProductName())
                        .productPrice(item.getProductPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .status(item.getStatus())
                        .cancelledQuantity(item.getCancelledQuantity())
                        .refundedAmount(item.getRefundedAmount())
                        .build()
                ).toList();

        return OrderResponse.builder()
                .id(order.getId().toHexString())
                .userId(order.getUser().getId().toHexString())
                .userEmail(order.getUser().getEmail())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .createdAt(order.getCreatedAt())
                .lastUpdated(order.getLastUpdated())
                .items(itemResponses)
                .build();
    }
}