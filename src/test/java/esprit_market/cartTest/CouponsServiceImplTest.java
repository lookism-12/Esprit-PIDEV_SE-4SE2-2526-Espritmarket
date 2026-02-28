package esprit_market.cartTest;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.dto.CouponCreateRequest;
import esprit_market.dto.CouponResponse;
import esprit_market.dto.CouponUpdateRequest;
import esprit_market.entity.cart.Coupons;
import esprit_market.mappers.CouponMapper;
import esprit_market.repository.cartRepository.CouponRepository;
import esprit_market.service.cartService.CouponNotValidException;
import esprit_market.service.cartService.CouponsServiceImpl;
import esprit_market.service.cartService.ResourceNotFoundException;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CouponsServiceImpl.
 * Tests coupon CRUD operations, validation rules, user level eligibility, and usage management.
 * 
 * Business Rules:
 * - Coupon must be active
 * - Coupon must not be expired
 * - Usage count must not exceed limit
 * - Cart total must meet minimum amount
 * - User level must match eligibility
 * 
 * User Level Hierarchy: PLATINUM > GOLD > SILVER > BRONZE
 */
@ExtendWith(MockitoExtension.class)
class CouponsServiceImplTest {

    @Mock
    private CouponRepository repository;

    @Mock
    private CouponMapper mapper;

    @InjectMocks
    private CouponsServiceImpl couponsService;

    private ObjectId couponId;
    private Coupons testCoupon;
    private CouponResponse testResponse;

    @BeforeEach
    void setUp() {
        couponId = new ObjectId();

        testCoupon = Coupons.builder()
                .id(couponId)
                .code("SAVE20")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(20.0)
                .active(true)
                .expirationDate(LocalDate.now().plusDays(30))
                .usageLimit(100)
                .usageCount(0)
                .minCartAmount(50.0)
                .combinableWithDiscount(false)
                .build();

        testResponse = CouponResponse.builder()
                .id(couponId.toHexString())
                .code("SAVE20")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(20.0)
                .active(true)
                .build();
    }

    // ==================== CREATE COUPON TESTS ====================

    @Nested
    @DisplayName("createCoupon Tests")
    class CreateCouponTests {

        @Test
        @DisplayName("Should create coupon successfully with valid data")
        void createCoupon_ValidData_Success() {
            CouponCreateRequest request = CouponCreateRequest.builder()
                    .code("NEWCODE")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(15.0)
                    .expirationDate(LocalDate.now().plusDays(30))
                    .build();

            when(repository.existsByCode("NEWCODE")).thenReturn(false);
            when(mapper.toEntity(request)).thenReturn(testCoupon);
            when(repository.save(any(Coupons.class))).thenReturn(testCoupon);
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            CouponResponse result = couponsService.createCoupon(request);

            assertNotNull(result);
            verify(repository).save(any(Coupons.class));
        }

        @Test
        @DisplayName("Should throw exception for duplicate coupon code")
        void createCoupon_DuplicateCode_ThrowsException() {
            CouponCreateRequest request = CouponCreateRequest.builder()
                    .code("EXISTING")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(10.0)
                    .build();

            when(repository.existsByCode("EXISTING")).thenReturn(true);

            assertThrows(IllegalArgumentException.class,
                    () -> couponsService.createCoupon(request));
        }

        @Test
        @DisplayName("Should throw exception for past expiration date")
        void createCoupon_PastExpiration_ThrowsException() {
            CouponCreateRequest request = CouponCreateRequest.builder()
                    .code("EXPIRED")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(10.0)
                    .expirationDate(LocalDate.now().minusDays(1))
                    .build();

            when(repository.existsByCode("EXPIRED")).thenReturn(false);

            assertThrows(IllegalArgumentException.class,
                    () -> couponsService.createCoupon(request));
        }

        @Test
        @DisplayName("Should create FIXED type coupon")
        void createCoupon_FixedType_Success() {
            CouponCreateRequest request = CouponCreateRequest.builder()
                    .code("FLAT10")
                    .discountType(DiscountType.FIXED)
                    .discountValue(10.0)
                    .build();

            Coupons fixedCoupon = Coupons.builder()
                    .code("FLAT10")
                    .discountType(DiscountType.FIXED)
                    .discountValue(10.0)
                    .build();

            when(repository.existsByCode("FLAT10")).thenReturn(false);
            when(mapper.toEntity(request)).thenReturn(fixedCoupon);
            when(repository.save(any(Coupons.class))).thenReturn(fixedCoupon);
            when(mapper.toResponse(fixedCoupon))
                    .thenReturn(CouponResponse.builder().discountType(DiscountType.FIXED).build());

            CouponResponse result = couponsService.createCoupon(request);

            assertNotNull(result);
            assertEquals(DiscountType.FIXED, result.getDiscountType());
        }
    }

    // ==================== UPDATE COUPON TESTS ====================

    @Nested
    @DisplayName("updateCoupon Tests")
    class UpdateCouponTests {

        @Test
        @DisplayName("Should update coupon successfully")
        void updateCoupon_ValidUpdate_Success() {
            CouponUpdateRequest request = CouponUpdateRequest.builder()
                    .discountValue(25.0)
                    .build();

            when(repository.findById(couponId)).thenReturn(Optional.of(testCoupon));
            doNothing().when(mapper).updateEntity(any(Coupons.class), any(CouponUpdateRequest.class));
            when(repository.save(any(Coupons.class))).thenReturn(testCoupon);
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            CouponResponse result = couponsService.updateCoupon(couponId, request);

            assertNotNull(result);
            verify(repository).save(any(Coupons.class));
        }

        @Test
        @DisplayName("Should throw exception when coupon not found")
        void updateCoupon_NotFound_ThrowsException() {
            CouponUpdateRequest request = CouponUpdateRequest.builder()
                    .discountValue(25.0)
                    .build();

            when(repository.findById(couponId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> couponsService.updateCoupon(couponId, request));
        }
    }

    // ==================== GET COUPON TESTS ====================

    @Nested
    @DisplayName("getCoupon Tests")
    class GetCouponTests {

        @Test
        @DisplayName("Should get coupon by ID")
        void getCouponById_Exists_ReturnsCoupon() {
            when(repository.findById(couponId)).thenReturn(Optional.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            CouponResponse result = couponsService.getCouponById(couponId);

            assertNotNull(result);
            assertEquals("SAVE20", result.getCode());
        }

        @Test
        @DisplayName("Should throw exception when coupon not found by ID")
        void getCouponById_NotFound_ThrowsException() {
            when(repository.findById(couponId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> couponsService.getCouponById(couponId));
        }

        @Test
        @DisplayName("Should get coupon by code")
        void getCouponByCode_Exists_ReturnsCoupon() {
            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            CouponResponse result = couponsService.getCouponByCode("SAVE20");

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should throw exception when coupon not found by code")
        void getCouponByCode_NotFound_ThrowsException() {
            when(repository.findByCode("INVALID")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> couponsService.getCouponByCode("INVALID"));
        }

        @Test
        @DisplayName("Should get all coupons")
        void findAll_ReturnsList() {
            when(repository.findAll()).thenReturn(List.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            List<CouponResponse> result = couponsService.findAll();

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should return empty list when no coupons")
        void findAll_Empty_ReturnsEmptyList() {
            when(repository.findAll()).thenReturn(Collections.emptyList());

            List<CouponResponse> result = couponsService.findAll();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ==================== GET ACTIVE COUPONS TESTS ====================

    @Nested
    @DisplayName("getActiveCoupons Tests")
    class GetActiveCouponsTests {

        @Test
        @DisplayName("Should get active non-expired coupons")
        void getActiveCoupons_ReturnsActive() {
            when(repository.findByActiveTrueAndExpirationDateAfter(any(LocalDate.class)))
                    .thenReturn(List.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            List<CouponResponse> result = couponsService.getActiveCoupons();

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should return empty list when no active coupons")
        void getActiveCoupons_None_ReturnsEmpty() {
            when(repository.findByActiveTrueAndExpirationDateAfter(any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            List<CouponResponse> result = couponsService.getActiveCoupons();

            assertTrue(result.isEmpty());
        }
    }

    // ==================== VALIDATE COUPON TESTS ====================

    @Nested
    @DisplayName("validateCoupon Tests")
    class ValidateCouponTests {

        @Test
        @DisplayName("Should validate active coupon successfully")
        void validateCoupon_Valid_Success() {
            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            CouponResponse result = couponsService.validateCoupon("SAVE20", 100.0);

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should throw exception for invalid coupon code")
        void validateCoupon_InvalidCode_ThrowsException() {
            when(repository.findByCode("INVALID")).thenReturn(Optional.empty());

            assertThrows(CouponNotValidException.class,
                    () -> couponsService.validateCoupon("INVALID", 100.0));
        }

        @Test
        @DisplayName("Should throw exception for inactive coupon")
        void validateCoupon_Inactive_ThrowsException() {
            testCoupon.setActive(false);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            assertThrows(CouponNotValidException.class,
                    () -> couponsService.validateCoupon("SAVE20", 100.0));
        }

        @Test
        @DisplayName("Should throw exception for expired coupon")
        void validateCoupon_Expired_ThrowsException() {
            testCoupon.setExpirationDate(LocalDate.now().minusDays(1));

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            assertThrows(CouponNotValidException.class,
                    () -> couponsService.validateCoupon("SAVE20", 100.0));
        }

        @Test
        @DisplayName("Should throw exception when usage limit reached")
        void validateCoupon_UsageLimitReached_ThrowsException() {
            testCoupon.setUsageLimit(10);
            testCoupon.setUsageCount(10);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            assertThrows(CouponNotValidException.class,
                    () -> couponsService.validateCoupon("SAVE20", 100.0));
        }

        @Test
        @DisplayName("Should throw exception when cart below minimum")
        void validateCoupon_BelowMinCart_ThrowsException() {
            testCoupon.setMinCartAmount(100.0);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            assertThrows(CouponNotValidException.class,
                    () -> couponsService.validateCoupon("SAVE20", 50.0));
        }

        @Test
        @DisplayName("Should validate coupon with null cart total when no minimum")
        void validateCoupon_NullCartNoMin_Success() {
            testCoupon.setMinCartAmount(null);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            CouponResponse result = couponsService.validateCoupon("SAVE20", null);

            assertNotNull(result);
        }
    }

    // ==================== VALIDATE WITH USER LEVEL TESTS ====================

    @Nested
    @DisplayName("validateCouponWithUserLevel Tests")
    class ValidateCouponWithUserLevelTests {

        @Test
        @DisplayName("Should validate when user level meets requirement")
        void validateWithUserLevel_Eligible_Success() {
            testCoupon.setEligibleUserLevel("SILVER");

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            // GOLD user can use SILVER coupon
            CouponResponse result = couponsService.validateCouponWithUserLevel("SAVE20", 100.0, "GOLD");

            assertNotNull(result);
        }

        @Test
        @DisplayName("Should throw exception when user level too low")
        void validateWithUserLevel_NotEligible_ThrowsException() {
            testCoupon.setEligibleUserLevel("GOLD");

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            // SILVER user cannot use GOLD coupon
            assertThrows(CouponNotValidException.class,
                    () -> couponsService.validateCouponWithUserLevel("SAVE20", 100.0, "SILVER"));
        }

        @Test
        @DisplayName("Should validate when no user level requirement")
        void validateWithUserLevel_NoRequirement_Success() {
            testCoupon.setEligibleUserLevel(null);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            CouponResponse result = couponsService.validateCouponWithUserLevel("SAVE20", 100.0, "BRONZE");

            assertNotNull(result);
        }

        @Test
        @DisplayName("PLATINUM user should access all level coupons")
        void validateWithUserLevel_Platinum_AccessAll() {
            testCoupon.setEligibleUserLevel("BRONZE");

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            CouponResponse result = couponsService.validateCouponWithUserLevel("SAVE20", 100.0, "PLATINUM");

            assertNotNull(result);
        }

        @Test
        @DisplayName("BRONZE user cannot use PLATINUM coupon")
        void validateWithUserLevel_BronzeToPlatinum_ThrowsException() {
            testCoupon.setEligibleUserLevel("PLATINUM");

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            assertThrows(CouponNotValidException.class,
                    () -> couponsService.validateCouponWithUserLevel("SAVE20", 100.0, "BRONZE"));
        }
    }

    // ==================== COMBINATION RULES TESTS ====================

    @Nested
    @DisplayName("canCombineWithDiscount Tests")
    class CombinationTests {

        @Test
        @DisplayName("Should return true when combinable")
        void canCombine_Combinable_ReturnsTrue() {
            testCoupon.setCombinableWithDiscount(true);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            boolean result = couponsService.canCombineWithDiscount("SAVE20");

            assertTrue(result);
        }

        @Test
        @DisplayName("Should return false when not combinable")
        void canCombine_NotCombinable_ReturnsFalse() {
            testCoupon.setCombinableWithDiscount(false);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            boolean result = couponsService.canCombineWithDiscount("SAVE20");

            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when coupon not found")
        void canCombine_NotFound_ReturnsFalse() {
            when(repository.findByCode("INVALID")).thenReturn(Optional.empty());

            boolean result = couponsService.canCombineWithDiscount("INVALID");

            assertFalse(result);
        }

        @Test
        @DisplayName("Should return false when combinable is null")
        void canCombine_NullCombinable_ReturnsFalse() {
            testCoupon.setCombinableWithDiscount(null);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            boolean result = couponsService.canCombineWithDiscount("SAVE20");

            assertFalse(result);
        }
    }

    // ==================== USAGE MANAGEMENT TESTS ====================

    @Nested
    @DisplayName("Usage Management Tests")
    class UsageManagementTests {

        @Test
        @DisplayName("Should increment usage count")
        void incrementUsage_Success() {
            testCoupon.setUsageCount(5);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(repository.save(any(Coupons.class))).thenReturn(testCoupon);

            couponsService.incrementCouponUsage("SAVE20");

            verify(repository).save(argThat(coupon -> coupon.getUsageCount() == 6));
        }

        @Test
        @DisplayName("Should increment usage from null to 1")
        void incrementUsage_FromNull_SetsTo1() {
            testCoupon.setUsageCount(null);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(repository.save(any(Coupons.class))).thenReturn(testCoupon);

            couponsService.incrementCouponUsage("SAVE20");

            verify(repository).save(argThat(coupon -> coupon.getUsageCount() == 1));
        }

        @Test
        @DisplayName("Should deactivate when limit reached on increment")
        void incrementUsage_LimitReached_Deactivates() {
            testCoupon.setUsageCount(99);
            testCoupon.setUsageLimit(100);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(repository.save(any(Coupons.class))).thenReturn(testCoupon);

            couponsService.incrementCouponUsage("SAVE20");

            verify(repository).save(argThat(coupon -> 
                    coupon.getUsageCount() == 100 && !coupon.getActive()));
        }

        @Test
        @DisplayName("Should throw exception when incrementing non-existent coupon")
        void incrementUsage_NotFound_ThrowsException() {
            when(repository.findByCode("INVALID")).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> couponsService.incrementCouponUsage("INVALID"));
        }

        @Test
        @DisplayName("Should decrement usage count")
        void decrementUsage_Success() {
            testCoupon.setUsageCount(5);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(repository.save(any(Coupons.class))).thenReturn(testCoupon);

            couponsService.decrementCouponUsage("SAVE20");

            verify(repository).save(argThat(coupon -> coupon.getUsageCount() == 4));
        }

        @Test
        @DisplayName("Should not decrement below zero")
        void decrementUsage_AtZero_NoChange() {
            testCoupon.setUsageCount(0);

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));

            couponsService.decrementCouponUsage("SAVE20");

            verify(repository, never()).save(any(Coupons.class));
        }

        @Test
        @DisplayName("Should reactivate coupon when decrementing below limit")
        void decrementUsage_BelowLimit_Reactivates() {
            testCoupon.setUsageCount(100);
            testCoupon.setUsageLimit(100);
            testCoupon.setActive(false);
            testCoupon.setExpirationDate(LocalDate.now().plusDays(10));

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(repository.save(any(Coupons.class))).thenReturn(testCoupon);

            couponsService.decrementCouponUsage("SAVE20");

            verify(repository).save(argThat(coupon -> 
                    coupon.getUsageCount() == 99 && coupon.getActive()));
        }

        @Test
        @DisplayName("Should not reactivate expired coupon on decrement")
        void decrementUsage_Expired_NoReactivate() {
            testCoupon.setUsageCount(100);
            testCoupon.setUsageLimit(100);
            testCoupon.setActive(false);
            testCoupon.setExpirationDate(LocalDate.now().minusDays(1));

            when(repository.findByCode("SAVE20")).thenReturn(Optional.of(testCoupon));
            when(repository.save(any(Coupons.class))).thenReturn(testCoupon);

            couponsService.decrementCouponUsage("SAVE20");

            verify(repository).save(argThat(coupon -> !coupon.getActive()));
        }

        @Test
        @DisplayName("Should handle decrement for non-existent coupon gracefully")
        void decrementUsage_NotFound_NoException() {
            when(repository.findByCode("INVALID")).thenReturn(Optional.empty());

            // Should not throw
            couponsService.decrementCouponUsage("INVALID");

            verify(repository, never()).save(any(Coupons.class));
        }
    }

    // ==================== DEACTIVATE EXPIRED TESTS ====================

    @Nested
    @DisplayName("deactivateExpiredCoupons Tests")
    class DeactivateExpiredTests {

        @Test
        @DisplayName("Should deactivate expired coupons")
        void deactivateExpired_HasExpired_Deactivates() {
            Coupons expiredCoupon = Coupons.builder()
                    .id(new ObjectId())
                    .code("EXPIRED")
                    .active(true)
                    .expirationDate(LocalDate.now().minusDays(1))
                    .build();

            when(repository.findByActiveTrue()).thenReturn(List.of(expiredCoupon));
            when(repository.save(any(Coupons.class))).thenReturn(expiredCoupon);

            couponsService.deactivateExpiredCoupons();

            verify(repository).save(argThat(coupon -> !coupon.getActive()));
        }

        @Test
        @DisplayName("Should not deactivate non-expired coupons")
        void deactivateExpired_NotExpired_NoChange() {
            when(repository.findByActiveTrue()).thenReturn(List.of(testCoupon));

            couponsService.deactivateExpiredCoupons();

            verify(repository, never()).save(any(Coupons.class));
        }

        @Test
        @DisplayName("Should not deactivate coupon without expiration date")
        void deactivateExpired_NoExpiration_NoChange() {
            Coupons noExpCoupon = Coupons.builder()
                    .id(new ObjectId())
                    .code("NOEXP")
                    .active(true)
                    .expirationDate(null)
                    .build();

            when(repository.findByActiveTrue()).thenReturn(List.of(noExpCoupon));

            couponsService.deactivateExpiredCoupons();

            verify(repository, never()).save(any(Coupons.class));
        }
    }

    // ==================== DELETE COUPON TESTS ====================

    @Nested
    @DisplayName("deleteCoupon Tests")
    class DeleteCouponTests {

        @Test
        @DisplayName("Should delete coupon by ID")
        void deleteCoupon_Success() {
            doNothing().when(repository).deleteById(couponId);

            couponsService.deleteCoupon(couponId);

            verify(repository).deleteById(couponId);
        }
    }

    // ==================== GET USER COUPONS TESTS ====================

    @Nested
    @DisplayName("getUserCoupons Tests")
    class GetUserCouponsTests {

        @Test
        @DisplayName("Should get coupons for user")
        void getUserCoupons_HasCoupons_ReturnsList() {
            ObjectId userId = new ObjectId();

            when(repository.findByUserId(userId)).thenReturn(List.of(testCoupon));
            when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

            List<CouponResponse> result = couponsService.getUserCoupons(userId);

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should return empty list when user has no coupons")
        void getUserCoupons_NoCoupons_ReturnsEmpty() {
            ObjectId userId = new ObjectId();

            when(repository.findByUserId(userId)).thenReturn(Collections.emptyList());

            List<CouponResponse> result = couponsService.getUserCoupons(userId);

            assertTrue(result.isEmpty());
        }
    }

    // ==================== GET COUPONS FOR USER LEVEL TESTS ====================

    @Nested
    @DisplayName("getCouponsForUserLevel Tests")
    class GetCouponsForUserLevelTests {

        @Test
        @DisplayName("Should filter coupons by user level eligibility")
        void getCouponsForUserLevel_FiltersCorrectly() {
            Coupons bronzeCoupon = Coupons.builder()
                    .code("BRONZE10")
                    .eligibleUserLevel("BRONZE")
                    .active(true)
                    .build();

            Coupons goldCoupon = Coupons.builder()
                    .code("GOLD20")
                    .eligibleUserLevel("GOLD")
                    .active(true)
                    .build();

            when(repository.findByActiveTrueAndExpirationDateAfter(any(LocalDate.class)))
                    .thenReturn(List.of(bronzeCoupon, goldCoupon));
            when(mapper.toResponse(bronzeCoupon)).thenReturn(
                    CouponResponse.builder().code("BRONZE10").build());

            // SILVER user can access BRONZE but not GOLD
            List<CouponResponse> result = couponsService.getCouponsForUserLevel("SILVER");

            assertEquals(1, result.size());
            assertEquals("BRONZE10", result.get(0).getCode());
        }

        @Test
        @DisplayName("Should include coupons with no level restriction")
        void getCouponsForUserLevel_IncludesNoRestriction() {
            Coupons noRestrictionCoupon = Coupons.builder()
                    .code("FORALL")
                    .eligibleUserLevel(null)
                    .active(true)
                    .build();

            when(repository.findByActiveTrueAndExpirationDateAfter(any(LocalDate.class)))
                    .thenReturn(List.of(noRestrictionCoupon));
            when(mapper.toResponse(noRestrictionCoupon)).thenReturn(
                    CouponResponse.builder().code("FORALL").build());

            List<CouponResponse> result = couponsService.getCouponsForUserLevel("BRONZE");

            assertEquals(1, result.size());
        }
    }
}
