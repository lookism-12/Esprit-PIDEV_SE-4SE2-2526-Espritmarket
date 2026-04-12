package esprit_market.mappers.cartMapper;

import esprit_market.dto.cartDto.OrderItemResponse;
import esprit_market.entity.cart.OrderItem;
import org.springframework.stereotype.Component;

@Component
public class OrderItemMapper {
    
    public OrderItemResponse toResponse(OrderItem item) {
        if (item == null) {
            return null;
        }
        
        return OrderItemResponse.builder()
                .id(item.getId() != null ? item.getId().toHexString() : null)
                .orderId(item.getOrderId() != null ? item.getOrderId().toHexString() : null)
                .productId(item.getProductId() != null ? item.getProductId().toHexString() : null)
                .productName(item.getProductName())
                .productPrice(item.getProductPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .status(item.getStatus())
                .cancelledQuantity(item.getCancelledQuantity())
                .refundedAmount(item.getRefundedAmount())
                .build();
    }
}
