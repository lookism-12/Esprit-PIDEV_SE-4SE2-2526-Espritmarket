package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "discounts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Discount {
    @Id
    private ObjectId id;
    
    private String name;
    
    private String description;
    
    private DiscountType discountType;
    
    private Double discountValue;
    
    private LocalDate startDate;
    
    private LocalDate endDate;
    
    private Boolean active;
    
    private Double minCartAmount;
    
    private Boolean autoActivate;
    
    // Discount — Category (ManyToMany BIDIRECTIONAL)
    @Builder.Default
    private List<ObjectId> categoryIds = new ArrayList<>();
}
