package esprit_market.dto.cartDto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Event Promotion Configuration Response DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventPromotionResponse {
    
    private String id;
    private String providerId;
    private String shopId;
    
    // Holiday Promotion
    private Boolean holidayEnabled;
    private Double holidayDiscountPercentage;
    private Double holidayMinOrderAmount;
    private Double holidayMaxDiscount;
    private String holidayDescription;
    
    // Birthday Promotion
    private Boolean birthdayEnabled;
    private Double birthdayDiscountPercentage;
    private Double birthdayMinOrderAmount;
    private Double birthdayMaxDiscount;
    private String birthdayDescription;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
