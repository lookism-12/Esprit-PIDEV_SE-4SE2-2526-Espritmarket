package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.dto.cartDto.CouponCreateRequest;
import esprit_market.dto.cartDto.CouponResponse;
import esprit_market.dto.cartDto.CouponUpdateRequest;
import esprit_market.entity.cart.Coupons;
import esprit_market.mappers.cartMapper.CouponMapper;
import esprit_market.repository.cartRepository.CouponRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("CouponsServiceImpl Tests")
class CouponsServiceImplTest {

    @Mock
    private CouponRepository repository;

    @Mock
    private CouponMapper mapper;

    @InjectMocks
    private CouponsServiceImpl couponService;

    private ObjectId couponId;
    private Coupons testCoupon;
    private CouponResponse testResponse;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        couponId = new ObjectId();

        testCoupon = Coupons.builder()
                .id(couponId)
                .code("TEST10")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(10.0)
                .active(true)
                .expirationDate(LocalDate.now().plusDays(30))
                .usageLimit(100)
                .usageCount(0)
                .minCartAmount(50.0)
                .build();

        testResponse = CouponResponse.builder()
                .id(couponId.toHexString())
                .code("TEST10")
                .build();
    }

    @Test
    @DisplayName("createCoupon_shouldCreateNewCoupon")
    void testCreateCoupon_ShouldCreateNewCoupon() {
        CouponCreateRequest request = new CouponCreateRequest();
        request.setCode("TEST10");

        when(repository.existsByCode("TEST10")).thenReturn(false);
        when(mapper.toEntity(request)).thenReturn(testCoupon);
        when(repository.save(testCoupon)).thenReturn(testCoupon);
        when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

        CouponResponse result = couponService.createCoupon(request);

        assertNotNull(result);
        verify(repository).existsByCode("TEST10");
        verify(repository).save(testCoupon);
    }

    @Test
    @DisplayName("createCoupon_shouldThrowException_whenCouponCodeExists")
    void testCreateCoupon_ShouldThrowException_WhenCodeExists() {
        CouponCreateRequest request = new CouponCreateRequest();
        request.setCode("TEST10");

        when(repository.existsByCode("TEST10")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> couponService.createCoupon(request));
    }

    @Test
    @DisplayName("createCoupon_shouldThrowException_whenExpirationDateInPast")
    void testCreateCoupon_ShouldThrowException_WhenExpirationDateInPast() {
        CouponCreateRequest request = new CouponCreateRequest();
        request.setCode("EXPIRED");
        request.setExpirationDate(LocalDate.now().minusDays(1));

        when(repository.existsByCode("EXPIRED")).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> couponService.createCoupon(request));
    }

    @Test
    @DisplayName("updateCoupon_shouldUpdateExistingCoupon")
    void testUpdateCoupon_ShouldUpdateExistingCoupon() {
        CouponUpdateRequest request = new CouponUpdateRequest();

        when(repository.findById(couponId)).thenReturn(Optional.of(testCoupon));
        when(repository.save(testCoupon)).thenReturn(testCoupon);
        when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

        CouponResponse result = couponService.updateCoupon(couponId, request);

        assertNotNull(result);
        verify(repository).findById(couponId);
        verify(repository).save(testCoupon);
    }

    @Test
    @DisplayName("updateCoupon_shouldThrowException_whenNotFound")
    void testUpdateCoupon_ShouldThrowException_WhenNotFound() {
        CouponUpdateRequest request = new CouponUpdateRequest();

        when(repository.findById(couponId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> couponService.updateCoupon(couponId, request));
    }

    @Test
    @DisplayName("getCouponById_shouldReturnCoupon")
    void testGetCouponById_ShouldReturnCoupon() {
        when(repository.findById(couponId)).thenReturn(Optional.of(testCoupon));
        when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

        CouponResponse result = couponService.getCouponById(couponId);

        assertNotNull(result);
        verify(repository).findById(couponId);
    }

    @Test
    @DisplayName("getCouponById_shouldThrowException_whenNotFound")
    void testGetCouponById_ShouldThrowException_WhenNotFound() {
        when(repository.findById(couponId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> couponService.getCouponById(couponId));
    }

    @Test
    @DisplayName("getCouponByCode_shouldReturnCoupon")
    void testGetCouponByCode_ShouldReturnCoupon() {
        when(repository.findByCode("TEST10")).thenReturn(Optional.of(testCoupon));
        when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

        CouponResponse result = couponService.getCouponByCode("TEST10");

        assertNotNull(result);
        verify(repository).findByCode("TEST10");
    }

    @Test
    @DisplayName("getCouponByCode_shouldThrowException_whenNotFound")
    void testGetCouponByCode_ShouldThrowException_WhenNotFound() {
        when(repository.findByCode("NONEXISTENT")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> couponService.getCouponByCode("NONEXISTENT"));
    }

    @Test
    @DisplayName("getUserCoupons_shouldReturnUserCoupons")
    void testGetUserCoupons_ShouldReturnUserCoupons() {
        ObjectId userId = new ObjectId();
        List<Coupons> coupons = List.of(testCoupon);

        when(repository.findByUserId(userId)).thenReturn(coupons);
        when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

        List<CouponResponse> result = couponService.getUserCoupons(userId);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        verify(repository).findByUserId(userId);
    }

    @Test
    @DisplayName("getActiveCoupons_shouldReturnOnlyActiveCoupons")
    void testGetActiveCoupons_ShouldReturnOnlyActiveCoupons() {
        List<Coupons> activeCoupons = List.of(testCoupon);

        when(repository.findByActiveTrueAndExpirationDateAfter(any(LocalDate.class)))
                .thenReturn(activeCoupons);
        when(mapper.toResponse(testCoupon)).thenReturn(testResponse);

        List<CouponResponse> result = couponService.getActiveCoupons();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        verify(repository).findByActiveTrueAndExpirationDateAfter(any(LocalDate.class));
    }

    @Test
    @DisplayName("deleteCoupon_shouldDeleteCoupon")
    void testDeleteCoupon_ShouldDeleteCoupon() {
        when(repository.findById(couponId)).thenReturn(Optional.of(testCoupon));

        couponService.deleteCoupon(couponId);

        verify(repository).findById(couponId);
        verify(repository).delete(testCoupon);
    }
}
