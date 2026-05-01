package esprit_market.mappers.cartMapper;

import esprit_market.dto.cartDto.OrderResponse;
import esprit_market.entity.cart.Order;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {
    
    public OrderResponse toResponse(Order order) {
        if (order == null) {
            return null;
        }
        
        return OrderResponse.builder()
                .id(order.getId() != null ? order.getId().toHexString() : null)
                .userId(order.getUser() != null ? order.getUser().getId().toHexString() : null)
                .userEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .paymentStatus(order.getPaymentStatus())
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .couponCode(order.getCouponCode())
                .discountId(order.getDiscountId() != null ? order.getDiscountId().toHexString() : null)
                .shippingAddress(order.getShippingAddress())
                .paymentMethod(order.getPaymentMethod())
                .paymentId(order.getPaymentId())
                .cartId(order.getCartId() != null ? order.getCartId().toHexString() : null)
                .deliveryId(order.getDeliveryId() != null ? order.getDeliveryId().toHexString() : null)
                .createdAt(order.getCreatedAt())
                .paidAt(order.getPaidAt())
                .lastUpdated(order.getLastUpdated())
                .cancellationReason(order.getCancellationReason())
                .cancelledAt(order.getCancelledAt())
                .build();
    }
}
