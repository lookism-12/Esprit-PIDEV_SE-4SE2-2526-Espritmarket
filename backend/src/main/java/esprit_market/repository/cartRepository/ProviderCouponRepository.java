package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.ProviderCoupon;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderCouponRepository extends MongoRepository<ProviderCoupon, ObjectId> {
    
    /**
     * Find all coupons for a specific provider
     */
    List<ProviderCoupon> findByProviderId(ObjectId providerId);
    
    /**
     * Find a coupon by code and provider ID (for uniqueness check)
     */
    Optional<ProviderCoupon> findByCodeAndProviderId(String code, ObjectId providerId);
    
    /**
     * Find active coupons for a specific provider
     */
    List<ProviderCoupon> findByActiveTrueAndProviderId(ObjectId providerId);
    
    /**
     * Check if a coupon code exists for a specific provider
     */
    boolean existsByCodeAndProviderId(String code, ObjectId providerId);
    
    /**
     * Find coupons by shop ID
     */
    List<ProviderCoupon> findByShopId(ObjectId shopId);
    
    /**
     * Find active coupons by shop ID
     */
    List<ProviderCoupon> findByActiveTrueAndShopId(ObjectId shopId);
}
