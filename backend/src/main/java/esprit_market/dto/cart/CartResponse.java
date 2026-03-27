package esprit_market.dto.cart;

import esprit_market.Enum.cartEnum.CartStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for cart/order data returned to clients.
 * Cart operations use specific request DTOs (AddToCartRequest, CheckoutRequest, etc.)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartResponse {
    
    private String id;
    
    private String userId;
    
    private LocalDateTime creationDate;
    
    private LocalDateTime lastUpdated;
    
    private Double subtotal;
    
    private Double discountAmount;
    
    private Double taxAmount;
    
    private Double total;
    
    private CartStatus status;
    
    private List<CartItemResponse> items;
    
    private String appliedCouponCode;
    
    private String appliedDiscountId;
    
    private String shippingAddress;
    
    private String billingAddress;
    
    private String notes;
    
    // Computed fields for client convenience
    private Integer totalItems;
    
    private Integer totalQuantity;
    
    private Boolean isEmpty;
    
    private Boolean hasDiscount;
    
    private Double savingsAmount;
}
