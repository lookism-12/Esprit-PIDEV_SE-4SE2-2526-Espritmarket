package esprit_market.dto.cartDto;

import esprit_market.Enum.cartEnum.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderCouponResponse {
    
    private String id;
    private String code;
    private String providerId;
    private String shopId;
    private DiscountType discountType;
    private Double discountValue;
    private Double minOrderAmount;
    private Double maxDiscount;
    private Integer usageLimit;
    private Integer usageCount;
    private LocalDate validFrom;
    private LocalDate validUntil;
    private Boolean isActive;
    private String scope;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
