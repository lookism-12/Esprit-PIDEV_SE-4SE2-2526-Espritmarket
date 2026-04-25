package esprit_market.service.cartService;

import esprit_market.dto.cartDto.ProviderCouponRequest;
import esprit_market.dto.cartDto.ProviderCouponResponse;
import org.bson.types.ObjectId;

import java.util.List;

public interface IProviderCouponService {
    
    /**
     * Create a new provider coupon
     */
    ProviderCouponResponse createCoupon(ProviderCouponRequest request, ObjectId providerId, ObjectId shopId);
    
    /**
     * Get all coupons for a provider
     */
    List<ProviderCouponResponse> getProviderCoupons(ObjectId providerId);
    
    /**
     * Get a specific coupon by ID (with ownership check)
     */
    ProviderCouponResponse getCouponById(ObjectId couponId, ObjectId providerId);
    
    /**
     * Update a coupon (with ownership check)
     */
    ProviderCouponResponse updateCoupon(ObjectId couponId, ProviderCouponRequest request, ObjectId providerId);
    
    /**
     * Delete a coupon (with ownership check)
     */
    void deleteCoupon(ObjectId couponId, ObjectId providerId);
    
    /**
     * Toggle coupon active status (with ownership check)
     */
    ProviderCouponResponse toggleCouponStatus(ObjectId couponId, Boolean isActive, ObjectId providerId);
    
    /**
     * Validate a coupon for use (check expiration, usage limit, active status, minimum order)
     */
    ProviderCouponResponse validateCoupon(String code, ObjectId shopId, Double orderTotal);
    
    /**
     * Increment usage count when coupon is redeemed
     */
    void incrementUsageCount(ObjectId couponId);
}
