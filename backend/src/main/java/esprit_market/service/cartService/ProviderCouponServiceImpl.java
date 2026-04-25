package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.config.Exceptions;
import esprit_market.dto.cartDto.ProviderCouponRequest;
import esprit_market.dto.cartDto.ProviderCouponResponse;
import esprit_market.entity.cart.ProviderCoupon;
import esprit_market.repository.cartRepository.ProviderCouponRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.service.notificationService.INotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Provider Coupon Service Implementation
 * 
 * Business Rules:
 * 1. Providers can only manage their own coupons
 * 2. Coupon codes must be unique per provider (not globally unique)
 * 3. All provider coupons are SHOP_SPECIFIC (never global)
 * 4. Validation checks: active status, expiration, usage limits, minimum order
 * 5. Ownership verification on all update/delete operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderCouponServiceImpl implements IProviderCouponService {
    
    private final ProviderCouponRepository providerCouponRepository;
    private final ShopRepository shopRepository;
    private final INotificationService notificationService;

    @Override
    @Transactional
    public ProviderCouponResponse createCoupon(ProviderCouponRequest request, ObjectId providerId, ObjectId shopId) {
        log.info("Creating coupon for provider {} with code: {}", providerId.toHexString(), request.getCode());
        
        // Validate shop ownership and get shop details
        var shop = shopRepository.findById(shopId)
                .filter(s -> s.getOwnerId().equals(providerId))
                .orElseThrow(() -> new Exceptions.AccessDeniedException("Shop does not belong to this provider"));
        
        String shopName = shop.getName() != null ? shop.getName() : "Shop";
        
        // Check if coupon code already exists for this provider
        if (providerCouponRepository.existsByCodeAndProviderId(request.getCode(), providerId)) {
            log.error("Coupon code {} already exists for provider {}", request.getCode(), providerId.toHexString());
            throw new IllegalArgumentException("Coupon code already exists for your shop: " + request.getCode());
        }
        
        // Validate dates
        if (request.getValidUntil().isBefore(request.getValidFrom())) {
            throw new IllegalArgumentException("Valid until date must be after valid from date");
        }
        
        if (request.getValidUntil().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Valid until date must be in the future");
        }
        
        // Validate discount value for percentage type
        if (request.getDiscountType().name().equals("PERCENTAGE") && request.getDiscountValue() > 100) {
            throw new IllegalArgumentException("Percentage discount cannot exceed 100%");
        }
        
        // Build entity
        ProviderCoupon coupon = ProviderCoupon.builder()
                .code(request.getCode().toUpperCase())
                .providerId(providerId)
                .shopId(shopId)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .minimumOrderAmount(request.getMinimumOrderAmount())
                .maximumDiscount(request.getMaximumDiscount())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .active(request.getIsActive())
                .scope("SHOP_SPECIFIC")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        ProviderCoupon saved = providerCouponRepository.save(coupon);
        log.info("Coupon created successfully with ID: {}", saved.getId().toHexString());
        
        // Trigger notification broadcast to customers (only if coupon is active and valid)
        if (Boolean.TRUE.equals(saved.getActive()) && 
            saved.getValidFrom() != null && 
            saved.getValidUntil() != null &&
            !LocalDate.now().isBefore(saved.getValidFrom()) &&
            !LocalDate.now().isAfter(saved.getValidUntil())) {
            
            try {
                String discountInfo = formatDiscountInfo(saved.getDiscountType(), saved.getDiscountValue());
                notificationService.notifyUsersAboutCoupon(
                        saved.getId(),
                        saved.getCode(),
                        shopName,
                        discountInfo,
                        saved.getValidUntil().atStartOfDay()
                );
                log.info("Coupon notification broadcast triggered for: {}", saved.getCode());
            } catch (Exception e) {
                log.error("Failed to broadcast coupon notification: {}", e.getMessage(), e);
                // Don't fail the coupon creation if notification fails
            }
        }
        
        return toResponse(saved);
    }

    @Override
    public List<ProviderCouponResponse> getProviderCoupons(ObjectId providerId) {
        log.info("Fetching all coupons for provider: {}", providerId.toHexString());
        
        List<ProviderCoupon> coupons = providerCouponRepository.findByProviderId(providerId);
        log.info("Found {} coupons for provider {}", coupons.size(), providerId.toHexString());
        
        return coupons.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ProviderCouponResponse getCouponById(ObjectId couponId, ObjectId providerId) {
        log.info("Fetching coupon {} for provider {}", couponId.toHexString(), providerId.toHexString());
        
        ProviderCoupon coupon = providerCouponRepository.findById(couponId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Coupon not found"));
        
        // Verify ownership
        if (!coupon.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to access coupon {} owned by provider {}", 
                    providerId.toHexString(), couponId.toHexString(), coupon.getProviderId().toHexString());
            throw new Exceptions.AccessDeniedException("You do not have permission to access this coupon");
        }
        
        return toResponse(coupon);
    }

    @Override
    @Transactional
    public ProviderCouponResponse updateCoupon(ObjectId couponId, ProviderCouponRequest request, ObjectId providerId) {
        log.info("Updating coupon {} for provider {}", couponId.toHexString(), providerId.toHexString());
        
        ProviderCoupon existing = providerCouponRepository.findById(couponId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Coupon not found"));
        
        // Verify ownership
        if (!existing.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to update coupon {} owned by provider {}", 
                    providerId.toHexString(), couponId.toHexString(), existing.getProviderId().toHexString());
            throw new Exceptions.AccessDeniedException("You do not have permission to update this coupon");
        }
        
        // Check if code is being changed and if new code already exists
        if (!existing.getCode().equals(request.getCode().toUpperCase())) {
            if (providerCouponRepository.existsByCodeAndProviderId(request.getCode(), providerId)) {
                throw new IllegalArgumentException("Coupon code already exists for your shop: " + request.getCode());
            }
        }
        
        // Validate dates
        if (request.getValidUntil().isBefore(request.getValidFrom())) {
            throw new IllegalArgumentException("Valid until date must be after valid from date");
        }
        
        // Validate discount value for percentage type
        if (request.getDiscountType().name().equals("PERCENTAGE") && request.getDiscountValue() > 100) {
            throw new IllegalArgumentException("Percentage discount cannot exceed 100%");
        }
        
        // Update fields
        existing.setCode(request.getCode().toUpperCase());
        existing.setDiscountType(request.getDiscountType());
        existing.setDiscountValue(request.getDiscountValue());
        existing.setMinimumOrderAmount(request.getMinimumOrderAmount());
        existing.setMaximumDiscount(request.getMaximumDiscount());
        existing.setUsageLimit(request.getUsageLimit());
        existing.setValidFrom(request.getValidFrom());
        existing.setValidUntil(request.getValidUntil());
        existing.setActive(request.getIsActive());
        existing.setUpdatedAt(LocalDateTime.now());
        
        ProviderCoupon updated = providerCouponRepository.save(existing);
        log.info("Coupon {} updated successfully", couponId.toHexString());
        
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCoupon(ObjectId couponId, ObjectId providerId) {
        log.info("Deleting coupon {} for provider {}", couponId.toHexString(), providerId.toHexString());
        
        ProviderCoupon coupon = providerCouponRepository.findById(couponId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Coupon not found"));
        
        // Verify ownership
        if (!coupon.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to delete coupon {} owned by provider {}", 
                    providerId.toHexString(), couponId.toHexString(), coupon.getProviderId().toHexString());
            throw new Exceptions.AccessDeniedException("You do not have permission to delete this coupon");
        }
        
        providerCouponRepository.deleteById(couponId);
        log.info("Coupon {} deleted successfully", couponId.toHexString());
    }

    @Override
    @Transactional
    public ProviderCouponResponse toggleCouponStatus(ObjectId couponId, Boolean isActive, ObjectId providerId) {
        log.info("Toggling coupon {} status to {} for provider {}", 
                couponId.toHexString(), isActive, providerId.toHexString());
        
        ProviderCoupon coupon = providerCouponRepository.findById(couponId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Coupon not found"));
        
        // Verify ownership
        if (!coupon.getProviderId().equals(providerId)) {
            log.error("Provider {} attempted to toggle coupon {} owned by provider {}", 
                    providerId.toHexString(), couponId.toHexString(), coupon.getProviderId().toHexString());
            throw new Exceptions.AccessDeniedException("You do not have permission to modify this coupon");
        }
        
        coupon.setActive(isActive);
        coupon.setUpdatedAt(LocalDateTime.now());
        
        ProviderCoupon updated = providerCouponRepository.save(coupon);
        log.info("Coupon {} status toggled to {}", couponId.toHexString(), isActive);
        
        return toResponse(updated);
    }

    @Override
    public ProviderCouponResponse validateCoupon(String code, ObjectId shopId, Double orderTotal) {
        log.info("Validating coupon {} for shop {} with order total {}", 
                code, shopId.toHexString(), orderTotal);
        
        // Find coupon by code and shop
        List<ProviderCoupon> coupons = providerCouponRepository.findByShopId(shopId);
        ProviderCoupon coupon = coupons.stream()
                .filter(c -> c.getCode().equalsIgnoreCase(code))
                .findFirst()
                .orElseThrow(() -> new CouponNotValidException("Invalid coupon code"));
        
        // Validate active status
        if (!Boolean.TRUE.equals(coupon.getActive())) {
            throw new CouponNotValidException("Coupon is not active");
        }
        
        // Validate expiration
        LocalDate today = LocalDate.now();
        if (coupon.getValidFrom() != null && today.isBefore(coupon.getValidFrom())) {
            throw new CouponNotValidException("Coupon is not yet valid");
        }
        if (coupon.getValidUntil() != null && today.isAfter(coupon.getValidUntil())) {
            throw new CouponNotValidException("Coupon has expired");
        }
        
        // Validate usage limit
        if (coupon.getUsageLimit() != null && 
            coupon.getUsedCount() != null &&
            coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new CouponNotValidException("Coupon usage limit reached");
        }
        
        // Validate minimum order amount
        if (coupon.getMinimumOrderAmount() != null && 
            (orderTotal == null || orderTotal < coupon.getMinimumOrderAmount())) {
            throw new CouponNotValidException(
                    "Order total must be at least " + coupon.getMinimumOrderAmount());
        }
        
        log.info("Coupon {} validated successfully", code);
        return toResponse(coupon);
    }

    @Override
    @Transactional
    public void incrementUsageCount(ObjectId couponId) {
        log.info("Incrementing usage count for coupon {}", couponId.toHexString());
        
        ProviderCoupon coupon = providerCouponRepository.findById(couponId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Coupon not found"));
        
        int newCount = (coupon.getUsedCount() != null ? coupon.getUsedCount() : 0) + 1;
        coupon.setUsedCount(newCount);
        
        // Auto-deactivate if usage limit reached
        if (coupon.getUsageLimit() != null && newCount >= coupon.getUsageLimit()) {
            coupon.setActive(false);
            log.info("Coupon {} auto-deactivated after reaching usage limit", couponId.toHexString());
        }
        
        coupon.setUpdatedAt(LocalDateTime.now());
        providerCouponRepository.save(coupon);
        
        log.info("Coupon {} usage count incremented to {}", couponId.toHexString(), newCount);
    }
    
    // ==================== HELPER METHODS ====================
    
    private void validateShopOwnership(ObjectId shopId, ObjectId providerId) {
        shopRepository.findById(shopId)
                .filter(shop -> shop.getOwnerId().equals(providerId))
                .orElseThrow(() -> new Exceptions.AccessDeniedException("Shop does not belong to this provider"));
    }
    
    private String formatDiscountInfo(DiscountType discountType, Double discountValue) {
        if (discountType == DiscountType.PERCENTAGE) {
            return String.format("%.0f%% off", discountValue);
        } else {
            return String.format("$%.2f off", discountValue);
        }
    }
    
    private ProviderCouponResponse toResponse(ProviderCoupon coupon) {
        return ProviderCouponResponse.builder()
                .id(coupon.getId().toHexString())
                .code(coupon.getCode())
                .providerId(coupon.getProviderId().toHexString())
                .shopId(coupon.getShopId().toHexString())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minOrderAmount(coupon.getMinimumOrderAmount())
                .maxDiscount(coupon.getMaximumDiscount())
                .usageLimit(coupon.getUsageLimit())
                .usageCount(coupon.getUsedCount())
                .validFrom(coupon.getValidFrom())
                .validUntil(coupon.getValidUntil())
                .isActive(coupon.getActive())
                .scope(coupon.getScope())
                .createdAt(coupon.getCreatedAt())
                .updatedAt(coupon.getUpdatedAt())
                .build();
    }
}
