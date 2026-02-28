package esprit_market.controller.cartController;

import esprit_market.dto.CouponCreateRequest;
import esprit_market.dto.CouponResponse;
import esprit_market.dto.CouponUpdateRequest;
import esprit_market.dto.LoyaltyCardResponse;
import esprit_market.service.cartService.AuthHelperService;
import esprit_market.service.cartService.ICouponsService;
import esprit_market.service.cartService.ILoyaltyCardService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {
    private final ICouponsService couponService;
    private final ILoyaltyCardService loyaltyCardService;
    private final AuthHelperService authHelper;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public ResponseEntity<CouponResponse> createCoupon(@Valid @RequestBody CouponCreateRequest request) {
        CouponResponse created = couponService.createCoupon(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CouponResponse> getCouponById(@PathVariable String id) {
        CouponResponse coupon = couponService.getCouponById(new ObjectId(id));
        return ResponseEntity.ok(coupon);
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<CouponResponse> getCouponByCode(@PathVariable String code) {
        CouponResponse coupon = couponService.getCouponByCode(code);
        return ResponseEntity.ok(coupon);
    }

    @GetMapping("/my-coupons")
    public ResponseEntity<List<CouponResponse>> getMyCoupons(Authentication authentication) {
        ObjectId userId = authHelper.getUserIdFromAuthentication(authentication);
        List<CouponResponse> coupons = couponService.getUserCoupons(userId);
        return ResponseEntity.ok(coupons);
    }

    @GetMapping("/active")
    public ResponseEntity<List<CouponResponse>> getActiveCoupons() {
        List<CouponResponse> coupons = couponService.getActiveCoupons();
        return ResponseEntity.ok(coupons);
    }
    
    /**
     * Get coupons available for the current user based on their loyalty level.
     */
    @GetMapping("/available-for-me")
    public ResponseEntity<List<CouponResponse>> getAvailableCouponsForMe(Authentication authentication) {
        ObjectId userId = authHelper.getUserIdFromAuthentication(authentication);
        LoyaltyCardResponse loyaltyCard = loyaltyCardService.getOrCreateLoyaltyCard(userId);
        String userLevel = loyaltyCard.getLevel() != null ? loyaltyCard.getLevel() : "BRONZE";
        List<CouponResponse> coupons = couponService.getCouponsForUserLevel(userLevel);
        return ResponseEntity.ok(coupons);
    }

    @PostMapping("/validate")
    public ResponseEntity<CouponResponse> validateCoupon(
            @RequestParam String code,
            @RequestParam Double cartTotal) {
        CouponResponse coupon = couponService.validateCoupon(code, cartTotal);
        return ResponseEntity.ok(coupon);
    }
    
    /**
     * Validate coupon with user level eligibility check.
     */
    @PostMapping("/validate-with-level")
    public ResponseEntity<CouponResponse> validateCouponWithLevel(
            @RequestParam String code,
            @RequestParam Double cartTotal,
            Authentication authentication) {
        ObjectId userId = authHelper.getUserIdFromAuthentication(authentication);
        LoyaltyCardResponse loyaltyCard = loyaltyCardService.getOrCreateLoyaltyCard(userId);
        String userLevel = loyaltyCard.getLevel() != null ? loyaltyCard.getLevel() : "BRONZE";
        CouponResponse coupon = couponService.validateCouponWithUserLevel(code, cartTotal, userLevel);
        return ResponseEntity.ok(coupon);
    }
    
    /**
     * Check if a coupon can be combined with other discounts.
     */
    @GetMapping("/can-combine/{code}")
    public ResponseEntity<Boolean> canCombineWithDiscount(@PathVariable String code) {
        boolean canCombine = couponService.canCombineWithDiscount(code);
        return ResponseEntity.ok(canCombine);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public ResponseEntity<CouponResponse> updateCoupon(
            @PathVariable String id,
            @Valid @RequestBody CouponUpdateRequest request) {
        CouponResponse updated = couponService.updateCoupon(new ObjectId(id), request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCoupon(@PathVariable String id) {
        couponService.deleteCoupon(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/deactivate-expired")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivateExpired() {
        couponService.deactivateExpiredCoupons();
        return ResponseEntity.ok().build();
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROVIDER')")
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        List<CouponResponse> coupons = couponService.findAll();
        return ResponseEntity.ok(coupons);
    }
}

