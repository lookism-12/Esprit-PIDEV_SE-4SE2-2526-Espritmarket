package esprit_market.entity.cart;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.Enum.cartEnum.EventPromotionType;
import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Event-Based Promotion Entity
 * 
 * Allows providers to configure automatic discounts based on special events:
 * - Holidays (Ramadan, Eid, Independence Day, etc.)
 * - Customer birthdays
 * 
 * These promotions are separate from order-based promotions and are triggered
 * by date/context rather than cart conditions.
 * 
 * Business Rules:
 * - Each provider can have ONE event promotion configuration
 * - Holiday and birthday promotions can be enabled/disabled independently
 * - Optional minimum order amount for each promotion type
 * - Promotions are applied automatically at checkout
 * - If multiple promotions apply, ONLY the best discount is used
 */
@Document(collection = "event_promotions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventPromotion {
    
    @Id
    private ObjectId id;
    
    @Indexed(unique = true)
    private ObjectId providerId;
    
    @Indexed
    private ObjectId shopId;
    
    // ==================== HOLIDAY PROMOTION ====================
    
    /**
     * Enable/disable holiday promotions
     */
    @Builder.Default
    private Boolean holidayEnabled = false;
    
    /**
     * Holiday discount percentage (e.g., 15.0 for 15%)
     */
    private Double holidayDiscountPercentage;
    
    /**
     * Minimum order amount to qualify for holiday discount (optional)
     */
    private Double holidayMinOrderAmount;
    
    /**
     * Maximum discount cap for holiday promotion (optional)
     */
    private Double holidayMaxDiscount;
    
    // ==================== BIRTHDAY PROMOTION ====================
    
    /**
     * Enable/disable birthday promotions
     */
    @Builder.Default
    private Boolean birthdayEnabled = false;
    
    /**
     * Birthday discount percentage (e.g., 20.0 for 20%)
     */
    private Double birthdayDiscountPercentage;
    
    /**
     * Minimum order amount to qualify for birthday discount (optional)
     */
    private Double birthdayMinOrderAmount;
    
    /**
     * Maximum discount cap for birthday promotion (optional)
     */
    private Double birthdayMaxDiscount;
    
    // ==================== METADATA ====================
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // ==================== HELPER METHODS ====================
    
    /**
     * Check if holiday promotion is applicable for given order amount
     */
    public boolean isHolidayApplicable(Double orderAmount) {
        if (!Boolean.TRUE.equals(holidayEnabled)) {
            return false;
        }
        if (holidayDiscountPercentage == null || holidayDiscountPercentage <= 0) {
            return false;
        }
        if (holidayMinOrderAmount != null && orderAmount < holidayMinOrderAmount) {
            return false;
        }
        return true;
    }
    
    /**
     * Check if birthday promotion is applicable for given order amount
     */
    public boolean isBirthdayApplicable(Double orderAmount) {
        if (!Boolean.TRUE.equals(birthdayEnabled)) {
            return false;
        }
        if (birthdayDiscountPercentage == null || birthdayDiscountPercentage <= 0) {
            return false;
        }
        if (birthdayMinOrderAmount != null && orderAmount < birthdayMinOrderAmount) {
            return false;
        }
        return true;
    }
    
    /**
     * Calculate holiday discount amount
     */
    public Double calculateHolidayDiscount(Double orderAmount) {
        if (!isHolidayApplicable(orderAmount)) {
            return 0.0;
        }
        
        Double discount = orderAmount * (holidayDiscountPercentage / 100.0);
        
        // Apply maximum discount cap if specified
        if (holidayMaxDiscount != null && discount > holidayMaxDiscount) {
            return holidayMaxDiscount;
        }
        
        return discount;
    }
    
    /**
     * Calculate birthday discount amount
     */
    public Double calculateBirthdayDiscount(Double orderAmount) {
        if (!isBirthdayApplicable(orderAmount)) {
            return 0.0;
        }
        
        Double discount = orderAmount * (birthdayDiscountPercentage / 100.0);
        
        // Apply maximum discount cap if specified
        if (birthdayMaxDiscount != null && discount > birthdayMaxDiscount) {
            return birthdayMaxDiscount;
        }
        
        return discount;
    }
}
