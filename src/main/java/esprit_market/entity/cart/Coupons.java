package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;

@Document(collection = "coupons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Coupons {
    @Id
    private ObjectId id;
    
    @Indexed(unique = true)
    private String code;
    
    private DiscountType discountType;
    
    private Double discountValue;
    
    private LocalDate expirationDate;
    
    private Boolean active;
    
    private Double minCartAmount;
    
    private Integer usageLimit;
    
    private Integer usageCount;
    
    // User eligibility by loyalty level (e.g., "SILVER", "GOLD", "PLATINUM", or null for all)
    private String eligibleUserLevel;
    
    // User — Coupon (ManyToOne BIDIRECTIONAL)
    private ObjectId userId;
    
    // Can this coupon be combined with other discounts?
    @Builder.Default
    private Boolean combinableWithDiscount = false;
    
    // Description for display
    private String description;
}
