package esprit_market.entity.cart;

import com.fasterxml.jackson.annotation.JsonIgnore;
import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.entity.user.User;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Cart entity represents a temporary shopping basket.
 * 
 * Status: DRAFT (active shopping cart) only
 * 
 * This entity is ONLY for shopping cart functionality.
 * When user completes checkout, Cart data is converted to Order entity.
 * 
 * Cart should NEVER have order statuses (PAID, SHIPPED, etc.)
 * 
 * ⚠️ BACKWARD COMPATIBILITY NOTE:
 * Some fields are kept for backward compatibility with existing data.
 * New code should use Order entity for completed purchases.
 */
@Document(collection = "carts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cart {
    @Id
    private ObjectId id;
    
    @DBRef
    @JsonIgnore
    private User user;
    
    // Store userId directly to avoid @DBRef lazy loading issues
    private ObjectId userId;
    
    private LocalDateTime creationDate;
    
    private LocalDateTime lastUpdated;
    
    private Double subtotal;
    
    private Double discountAmount;
    
    private Double taxAmount;
    
    private Double total;
    
    private CartStatus status;
    
    @Builder.Default
    private List<ObjectId> cartItemIds = new ArrayList<>();
    
    private String appliedCouponCode;
    
    private ObjectId appliedDiscountId;
    
    private String shippingAddress;
    
    private String billingAddress;
    
    private String notes;
    
    @JsonIgnore
    public ObjectId getUserId() {
        // Prefer direct userId field to avoid @DBRef lazy loading issues
        if (userId != null) {
            return userId;
        }
        return user != null ? user.getId() : null;
    }
}
