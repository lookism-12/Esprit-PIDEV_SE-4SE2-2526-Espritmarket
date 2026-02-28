package esprit_market.service.cartService;

import esprit_market.dto.CouponCreateRequest;
import esprit_market.dto.CouponResponse;
import esprit_market.dto.CouponUpdateRequest;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICouponsService {
    
    // ==================== CREATE/UPDATE ====================
    
    CouponResponse createCoupon(CouponCreateRequest request);
    
    CouponResponse updateCoupon(ObjectId id, CouponUpdateRequest request);
    
    // ==================== READ ====================
    
    CouponResponse getCouponById(ObjectId id);
    
    CouponResponse getCouponByCode(String code);
    
    List<CouponResponse> getUserCoupons(ObjectId userId);
    
    List<CouponResponse> getActiveCoupons();
    
    List<CouponResponse> findAll();
    
    List<CouponResponse> getCouponsForUserLevel(String userLevel);
    
    // ==================== VALIDATION ====================
    
    CouponResponse validateCoupon(String code, Double cartTotal);
    
    CouponResponse validateCouponWithUserLevel(String code, Double cartTotal, String userLevel);
    
    boolean canCombineWithDiscount(String couponCode);
    
    // ==================== USAGE MANAGEMENT ====================
    
    void incrementCouponUsage(String code);
    
    void decrementCouponUsage(String code);
    
    void deactivateExpiredCoupons();
    
    void deleteCoupon(ObjectId id);
}
