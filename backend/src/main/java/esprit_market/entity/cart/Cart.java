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
        return user != null ? user.getId() : null;
    }
}
