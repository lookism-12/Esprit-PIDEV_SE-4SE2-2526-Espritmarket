package esprit_market.service.cartService;

import esprit_market.dto.CouponCreateRequest;
import esprit_market.dto.CouponResponse;
import esprit_market.dto.CouponUpdateRequest;
import esprit_market.entity.cart.Coupons;
import esprit_market.mappers.CouponMapper;
import esprit_market.repository.cartRepository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Coupon Service with Advanced Business Rules:
 * 
 * Validation Rules:
 * 1. Coupon must be active
 * 2. Coupon must not be expired
 * 3. Usage count must not exceed limit
 * 4. Cart total must meet minimum amount
 * 5. User level must match eligibility (if specified)
 * 
 * Combination Rules:
 * - By default, coupons cannot be combined with discounts
 * - If combinableWithDiscount = true, coupon can stack with other discounts
 * 
 * User Level Hierarchy (highest to lowest):
 * PLATINUM > GOLD > SILVER > BRONZE
 * 
 * A PLATINUM user can use coupons for: PLATINUM, GOLD, SILVER, BRONZE, or null (all)
 * A GOLD user can use coupons for: GOLD, SILVER, BRONZE, or null (all)
 * etc.
 */
@Service
@RequiredArgsConstructor
public class CouponsServiceImpl implements ICouponsService {
    private final CouponRepository repository;
    private final CouponMapper mapper;

    // ==================== CREATE/UPDATE ====================

    @Override
    @Transactional
    public CouponResponse createCoupon(CouponCreateRequest request) {
        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Coupon code already exists: " + request.getCode());
        }
        
        if (request.getExpirationDate() != null && request.getExpirationDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Expiration date must be in the future");
        }
        
        Coupons coupon = mapper.toEntity(request);
        Coupons saved = repository.save(coupon);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public CouponResponse updateCoupon(ObjectId id, CouponUpdateRequest request) {
        Coupons existing = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        
        mapper.updateEntity(existing, request);
        Coupons updated = repository.save(existing);
        return mapper.toResponse(updated);
    }

    // ==================== READ ====================

    @Override
    public CouponResponse getCouponById(ObjectId id) {
        Coupons coupon = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        return mapper.toResponse(coupon);
    }

    @Override
    public CouponResponse getCouponByCode(String code) {
        Coupons coupon = repository.findByCode(code)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon not found with code: " + code));
        return mapper.toResponse(coupon);
    }

    @Override
    public List<CouponResponse> getUserCoupons(ObjectId userId) {
        return repository.findByUserId(userId).stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    public List<CouponResponse> getActiveCoupons() {
        return repository.findByActiveTrueAndExpirationDateAfter(LocalDate.now()).stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<CouponResponse> findAll() {
        return repository.findAll().stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<CouponResponse> getCouponsForUserLevel(String userLevel) {
        return repository.findByActiveTrueAndExpirationDateAfter(LocalDate.now()).stream()
            .filter(coupon -> {
                String required = coupon.getEligibleUserLevel();
                if (required == null || required.isEmpty()) return true;
                return isUserLevelEligible(userLevel, required);
            })
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }

    // ==================== VALIDATION ====================

    @Override
    public CouponResponse validateCoupon(String code, Double cartTotal) {
        Coupons coupon = repository.findByCode(code)
            .orElseThrow(() -> new CouponNotValidException("Invalid coupon code"));
        
        validateCouponBasicRules(coupon, cartTotal);
        
        return mapper.toResponse(coupon);
    }
    
    @Override
    public CouponResponse validateCouponWithUserLevel(String code, Double cartTotal, String userLevel) {
        Coupons coupon = repository.findByCode(code)
            .orElseThrow(() -> new CouponNotValidException("Invalid coupon code"));
        
        validateCouponBasicRules(coupon, cartTotal);
        
        if (coupon.getEligibleUserLevel() != null && !coupon.getEligibleUserLevel().isEmpty()) {
            if (!isUserLevelEligible(userLevel, coupon.getEligibleUserLevel())) {
                throw new CouponNotValidException(
                    "This coupon requires " + coupon.getEligibleUserLevel() + " level or higher. " +
                    "Your current level: " + (userLevel != null ? userLevel : "BRONZE")
                );
            }
        }
        
        return mapper.toResponse(coupon);
    }
    
    @Override
    public boolean canCombineWithDiscount(String couponCode) {
        Coupons coupon = repository.findByCode(couponCode).orElse(null);
        if (coupon == null) return false;
        return Boolean.TRUE.equals(coupon.getCombinableWithDiscount());
    }
    
    private void validateCouponBasicRules(Coupons coupon, Double cartTotal) {
        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new CouponNotValidException("Coupon is not active");
        }
        
        if (coupon.getExpirationDate() != null && 
            coupon.getExpirationDate().isBefore(LocalDate.now())) {
            throw new CouponNotValidException("Coupon has expired");
        }
        
        if (coupon.getUsageLimit() != null && 
            coupon.getUsageCount() != null &&
            coupon.getUsageCount() >= coupon.getUsageLimit()) {
            throw new CouponNotValidException("Coupon usage limit reached");
        }
        
        if (coupon.getMinCartAmount() != null && 
            (cartTotal == null || cartTotal < coupon.getMinCartAmount())) {
            throw new CouponNotValidException("Cart total must be at least " + coupon.getMinCartAmount());
        }
    }
    
    private boolean isUserLevelEligible(String userLevel, String requiredLevel) {
        int userLevelRank = getLevelRank(userLevel);
        int requiredLevelRank = getLevelRank(requiredLevel);
        return userLevelRank >= requiredLevelRank;
    }
    
    private int getLevelRank(String level) {
        if (level == null) return 0;
        return switch (level.toUpperCase()) {
            case "PLATINUM" -> 4;
            case "GOLD" -> 3;
            case "SILVER" -> 2;
            case "BRONZE" -> 1;
            default -> 0;
        };
    }

    // ==================== USAGE MANAGEMENT ====================

    @Override
    @Transactional
    public void incrementCouponUsage(String code) {
        Coupons coupon = repository.findByCode(code)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        coupon.setUsageCount(coupon.getUsageCount() == null ? 1 : coupon.getUsageCount() + 1);
        
        if (coupon.getUsageLimit() != null && coupon.getUsageCount() >= coupon.getUsageLimit()) {
            coupon.setActive(false);
        }
        
        repository.save(coupon);
    }
    
    @Override
    @Transactional
    public void decrementCouponUsage(String code) {
        Coupons coupon = repository.findByCode(code).orElse(null);
        if (coupon == null) return;
        
        int currentUsage = coupon.getUsageCount() != null ? coupon.getUsageCount() : 0;
        if (currentUsage > 0) {
            coupon.setUsageCount(currentUsage - 1);
            
            if (coupon.getUsageLimit() != null && 
                coupon.getUsageCount() < coupon.getUsageLimit() &&
                (coupon.getExpirationDate() == null || !coupon.getExpirationDate().isBefore(LocalDate.now()))) {
                coupon.setActive(true);
            }
            
            repository.save(coupon);
        }
    }

    @Override
    @Transactional
    public void deactivateExpiredCoupons() {
        LocalDate today = LocalDate.now();
        List<Coupons> activeCoupons = repository.findByActiveTrue();
        
        for (Coupons coupon : activeCoupons) {
            if (coupon.getExpirationDate() != null && coupon.getExpirationDate().isBefore(today)) {
                coupon.setActive(false);
                repository.save(coupon);
            }
        }
    }

    @Override
    @Transactional
    public void deleteCoupon(ObjectId id) {
        repository.deleteById(id);
    }
}

