package esprit_market.entity.cart;

import com.fasterxml.jackson.annotation.JsonIgnore;
import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.entity.user.User;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.DBRef;
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
    
    private String eligibleUserLevel;
    
    @DBRef
    @JsonIgnore
    private User user;
    
    @Builder.Default
    private Boolean combinableWithDiscount = false;
    
    private String description;
    
    @JsonIgnore
    public ObjectId getUserId() {
        return user != null ? user.getId() : null;
    }
}
