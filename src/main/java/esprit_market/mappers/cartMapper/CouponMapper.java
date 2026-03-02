package esprit_market.mappers.cartMapper;

import esprit_market.dto.cartDto.CouponCreateRequest;
import esprit_market.dto.cartDto.CouponResponse;
import esprit_market.dto.cartDto.CouponUpdateRequest;
import esprit_market.entity.cart.Coupons;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class CouponMapper {
    
    private final UserRepository userRepository;
    
    /**
     * Convert entity to Response DTO with computed fields.
     */
    public CouponResponse toResponse(Coupons coupon) {
        if (coupon == null) return null;
        
        LocalDate today = LocalDate.now();
        boolean isExpired = coupon.getExpirationDate() != null && 
                            coupon.getExpirationDate().isBefore(today);
        boolean isUsageLimitReached = coupon.getUsageLimit() != null && 
                                       coupon.getUsageCount() != null &&
                                       coupon.getUsageCount() >= coupon.getUsageLimit();
        Integer remainingUsages = null;
        if (coupon.getUsageLimit() != null && coupon.getUsageCount() != null) {
            remainingUsages = Math.max(0, coupon.getUsageLimit() - coupon.getUsageCount());
        }
        
        return CouponResponse.builder()
            .id(coupon.getId() != null ? coupon.getId().toHexString() : null)
            .code(coupon.getCode())
            .discountType(coupon.getDiscountType())
            .discountValue(coupon.getDiscountValue())
            .expirationDate(coupon.getExpirationDate())
            .active(coupon.getActive())
            .minCartAmount(coupon.getMinCartAmount())
            .usageLimit(coupon.getUsageLimit())
            .usageCount(coupon.getUsageCount())
            .eligibleUserLevel(coupon.getEligibleUserLevel())
            .userId(coupon.getUserId() != null ? coupon.getUserId().toHexString() : null)
            .combinableWithDiscount(coupon.getCombinableWithDiscount())
            .description(coupon.getDescription())
            .isExpired(isExpired)
            .isUsageLimitReached(isUsageLimitReached)
            .remainingUsages(remainingUsages)
            .build();
    }
    
    /**
     * Convert CreateRequest to entity for new coupon creation.
     */
    public Coupons toEntity(CouponCreateRequest request) {
        if (request == null) return null;
        
        User user = null;
        if (isValidObjectId(request.getUserId())) {
            user = userRepository.findById(new ObjectId(request.getUserId())).orElse(null);
        }
        
        return Coupons.builder()
            .code(request.getCode())
            .discountType(request.getDiscountType())
            .discountValue(request.getDiscountValue())
            .expirationDate(request.getExpirationDate())
            .active(true)
            .minCartAmount(request.getMinCartAmount())
            .usageLimit(request.getUsageLimit())
            .usageCount(0)
            .eligibleUserLevel(request.getEligibleUserLevel())
            .user(user)
            .combinableWithDiscount(request.getCombinableWithDiscount() != null ? request.getCombinableWithDiscount() : false)
            .description(request.getDescription())
            .build();
    }
    
    /**
     * Apply UpdateRequest fields to existing entity.
     */
    public void updateEntity(Coupons existing, CouponUpdateRequest request) {
        if (existing == null || request == null) return;
        
        if (request.getCode() != null) existing.setCode(request.getCode());
        if (request.getDiscountType() != null) existing.setDiscountType(request.getDiscountType());
        if (request.getDiscountValue() != null) existing.setDiscountValue(request.getDiscountValue());
        if (request.getExpirationDate() != null) existing.setExpirationDate(request.getExpirationDate());
        if (request.getActive() != null) existing.setActive(request.getActive());
        if (request.getMinCartAmount() != null) existing.setMinCartAmount(request.getMinCartAmount());
        if (request.getUsageLimit() != null) existing.setUsageLimit(request.getUsageLimit());
        if (request.getEligibleUserLevel() != null) existing.setEligibleUserLevel(request.getEligibleUserLevel());
        if (request.getCombinableWithDiscount() != null) existing.setCombinableWithDiscount(request.getCombinableWithDiscount());
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
    }
    
    private boolean isValidObjectId(String id) {
        return id != null && !id.isEmpty() && id.length() == 24 && id.matches("[0-9a-fA-F]{24}");
    }
}
