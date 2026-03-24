package esprit_market.mappers.cartMapper;

import esprit_market.Enum.cartEnum.CartItemStatus;
import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.entity.cart.CartItem;
import org.springframework.stereotype.Component;

@Component
public class CartItemMapper {
    
    /**
     * Convert entity to Response DTO with computed fields.
     */
    public CartItemResponse toResponse(CartItem item) {
        if (item == null) return null;
        
        int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
        int cancelledQty = item.getCancelledQuantity() != null ? item.getCancelledQuantity() : 0;
        int availableQuantity = quantity - cancelledQty;
        
        boolean isPartiallyRefunded = cancelledQty > 0 && cancelledQty < quantity;
        boolean isFullyRefunded = cancelledQty >= quantity;
        
        return CartItemResponse.builder()
            .id(item.getId() != null ? item.getId().toHexString() : null)
            .cartId(item.getCartId() != null ? item.getCartId().toHexString() : null)
            .productId(item.getProductId() != null ? item.getProductId().toHexString() : null)
            .productName(item.getProductName())
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .subTotal(item.getSubTotal())
            .discountApplied(item.getDiscountApplied())
            .status(item.getStatus() != null ? item.getStatus() : CartItemStatus.ACTIVE)
            .cancelledQuantity(item.getCancelledQuantity())
            .refundAmount(item.getRefundAmount())
            .cancellationReason(item.getCancellationReason())
            .availableQuantity(availableQuantity)
            .isPartiallyRefunded(isPartiallyRefunded)
            .isFullyRefunded(isFullyRefunded)
            .build();
    }
}
