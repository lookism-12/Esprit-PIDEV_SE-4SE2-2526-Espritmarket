package esprit_market.dto;

import esprit_market.Enum.cartEnum.CartItemStatus;
import lombok.*;

/**
 * Response DTO for cart item data returned to clients.
 * Cart item operations use AddToCartRequest and UpdateCartItemRequest.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {
    
    private String id;
    
    private String cartId;
    
    private String productId;
    
    private String productName;
    
    private Integer quantity;
    
    private Double unitPrice;
    
    private Double subTotal;
    
    private Double discountApplied;
    
    private CartItemStatus status;
    
    // For partial cancellation/refund tracking
    private Integer cancelledQuantity;
    
    private Double refundAmount;
    
    private String cancellationReason;
    
    // Computed fields for client convenience
    private Integer availableQuantity;
    
    private Boolean isPartiallyRefunded;
    
    private Boolean isFullyRefunded;
}
