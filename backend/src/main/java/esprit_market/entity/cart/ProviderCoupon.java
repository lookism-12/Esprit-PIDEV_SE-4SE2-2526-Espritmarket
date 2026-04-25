package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Document(collection = "provider_coupons")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@CompoundIndex(name = "code_provider_idx", def = "{'code': 1, 'providerId': 1}", unique = true)
public class ProviderCoupon {
    
    @Id
    private ObjectId id;
    
    @Indexed
    private String code;
    
    @Indexed
    private ObjectId providerId;
    
    @Indexed
    private ObjectId shopId;
    
    private DiscountType discountType;
    
    private Double discountValue;
    
    private Double minimumOrderAmount;
    
    private Double maximumDiscount;
    
    private Integer usageLimit;
    
    @Builder.Default
    private Integer usedCount = 0;
    
    private LocalDate validFrom;
    
    private LocalDate validUntil;
    
    @Builder.Default
    private Boolean active = true;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Scope is always SHOP_SPECIFIC for provider coupons
    @Builder.Default
    private String scope = "SHOP_SPECIFIC";
}
