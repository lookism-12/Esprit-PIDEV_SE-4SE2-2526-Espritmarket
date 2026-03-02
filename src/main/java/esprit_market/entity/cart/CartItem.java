package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.CartItemStatus;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "cart_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {
    @Id
    private ObjectId id;
    
    // Cart — CartItem (OneToMany BIDIRECTIONAL)
    private ObjectId cartId;
    
    // Product — CartItem (ManyToOne UNIDIRECTIONAL)
    private ObjectId productId;
    
    // Snapshot fields (to preserve data at time of purchase)
    private String productName;
    
    private Integer quantity;
    
    private Double unitPrice;
    
    private Double subTotal;
    
    private Double discountApplied;
    
    // For partial cancellation/refund tracking
    @Builder.Default
    private CartItemStatus status = CartItemStatus.ACTIVE;
    
    private Integer cancelledQuantity;
    
    private Double refundAmount;
    
    private String cancellationReason;
}
