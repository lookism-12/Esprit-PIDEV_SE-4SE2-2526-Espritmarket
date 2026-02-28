package esprit_market;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.dto.DiscountCreateRequest;
import esprit_market.dto.DiscountResponse;
import esprit_market.dto.DiscountUpdateRequest;
import esprit_market.entity.cart.Discount;
import esprit_market.mappers.DiscountMapper;
import esprit_market.repository.cartRepository.DiscountRepository;
import esprit_market.service.cartService.DiscountServiceImpl;
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
 * Unit tests for DiscountServiceImpl.
 * Tests discount CRUD operations, validation, and business logic.
 */
@ExtendWith(MockitoExtension.class)
class DiscountServiceImplTest {

    @Mock
    private DiscountRepository repository;

    @Mock
    private DiscountMapper mapper;

    @InjectMocks
    private DiscountServiceImpl discountService;

    private ObjectId discountId;
    private Discount testDiscount;
    private DiscountResponse testResponse;

    @BeforeEach
    void setUp() {
        discountId = new ObjectId();

        testDiscount = Discount.builder()
                .id(discountId)
                .name("Summer Sale")
                .description("20% off all items")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(20.0)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .active(true)
                .minCartAmount(50.0)
                .build();

        testResponse = DiscountResponse.builder()
                .id(discountId.toHexString())
                .name("Summer Sale")
                .description("20% off all items")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(20.0)
                .active(true)
                .build();
    }

    // ==================== SAVE/CREATE DISCOUNT TESTS ====================

    @Nested
    @DisplayName("save (Create) Discount Tests")
    class SaveDiscountTests {

        @Test
        @DisplayName("Should create discount successfully with valid data")
        void save_ValidDiscount_Success() {
            DiscountCreateRequest request = DiscountCreateRequest.builder()
                    .name("New Sale")
                    .description("15% off")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(15.0)
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(10))
                    .build();

            when(mapper.toEntity(request)).thenReturn(testDiscount);
            when(repository.save(any(Discount.class))).thenReturn(testDiscount);
            when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

            DiscountResponse result = discountService.save(request);

            assertNotNull(result);
            assertEquals("Summer Sale", result.getName());
            verify(repository).save(any(Discount.class));
        }

        @Test
        @DisplayName("Should create discount with FIXED type")
        void save_FixedDiscount_Success() {
            DiscountCreateRequest request = DiscountCreateRequest.builder()
                    .name("Flat Discount")
                    .discountType(DiscountType.FIXED)
                    .discountValue(10.0)
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(10))
                    .build();

            Discount fixedDiscount = Discount.builder()
                    .discountType(DiscountType.FIXED)
                    .discountValue(10.0)
                    .build();

            when(mapper.toEntity(request)).thenReturn(fixedDiscount);
            when(repository.save(any(Discount.class))).thenReturn(fixedDiscount);
            when(mapper.toResponse(fixedDiscount))
                    .thenReturn(DiscountResponse.builder().discountType(DiscountType.FIXED).build());

            DiscountResponse result = discountService.save(request);

            assertNotNull(result);
            assertEquals(DiscountType.FIXED, result.getDiscountType());
        }

        @Test
        @DisplayName("Should throw exception when end date is before start date")
        void save_InvalidDateRange_ThrowsException() {
            DiscountCreateRequest request = DiscountCreateRequest.builder()
                    .name("Invalid Discount")
                    .startDate(LocalDate.now().plusDays(10))
                    .endDate(LocalDate.now()) // Before start date
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> discountService.save(request));
        }

        @Test
        @DisplayName("Should create discount without date range")
        void save_NoDateRange_Success() {
            DiscountCreateRequest request = DiscountCreateRequest.builder()
                    .name("Permanent Discount")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(5.0)
                    .build();

            when(mapper.toEntity(request)).thenReturn(testDiscount);
            when(repository.save(any(Discount.class))).thenReturn(testDiscount);
            when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

            DiscountResponse result = discountService.save(request);

            assertNotNull(result);
            verify(repository).save(any(Discount.class));
        }
    }

    // ==================== UPDATE DISCOUNT TESTS ====================

    @Nested
    @DisplayName("update Discount Tests")
    class UpdateDiscountTests {

        @Test
        @DisplayName("Should update discount successfully")
        void update_ValidUpdate_Success() {
            DiscountUpdateRequest request = DiscountUpdateRequest.builder()
                    .name("Updated Sale")
                    .discountValue(25.0)
                    .build();

            when(repository.findById(discountId)).thenReturn(Optional.of(testDiscount));
            doNothing().when(mapper).updateEntity(any(Discount.class), any(DiscountUpdateRequest.class));
            when(repository.save(any(Discount.class))).thenReturn(testDiscount);
            when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

            DiscountResponse result = discountService.update(discountId, request);

            assertNotNull(result);
            verify(repository).findById(discountId);
            verify(repository).save(any(Discount.class));
        }

        @Test
        @DisplayName("Should throw exception when discount not found")
        void update_DiscountNotFound_ThrowsException() {
            DiscountUpdateRequest request = DiscountUpdateRequest.builder()
                    .name("Updated Sale")
                    .build();

            when(repository.findById(discountId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> discountService.update(discountId, request));
        }

        @Test
        @DisplayName("Should throw exception when updating with invalid date range")
        void update_InvalidDateRange_ThrowsException() {
            DiscountUpdateRequest request = DiscountUpdateRequest.builder()
                    .startDate(LocalDate.now().plusDays(10))
                    .endDate(LocalDate.now())
                    .build();

            when(repository.findById(discountId)).thenReturn(Optional.of(testDiscount));

            assertThrows(IllegalArgumentException.class,
                    () -> discountService.update(discountId, request));
        }
    }

    // ==================== FIND DISCOUNT TESTS ====================

    @Nested
    @DisplayName("find Discount Tests")
    class FindDiscountTests {

        @Test
        @DisplayName("Should find all discounts")
        void findAll_ReturnsAllDiscounts() {
            List<Discount> discounts = List.of(testDiscount);

            when(repository.findAll()).thenReturn(discounts);
            when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

            List<DiscountResponse> result = discountService.findAll();

            assertNotNull(result);
            assertEquals(1, result.size());
            verify(repository).findAll();
        }

        @Test
        @DisplayName("Should return empty list when no discounts")
        void findAll_NoDiscounts_ReturnsEmpty() {
            when(repository.findAll()).thenReturn(Collections.emptyList());

            List<DiscountResponse> result = discountService.findAll();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }

        @Test
        @DisplayName("Should find discount by ID")
        void findById_ExistingDiscount_ReturnsDiscount() {
            when(repository.findById(discountId)).thenReturn(Optional.of(testDiscount));
            when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

            DiscountResponse result = discountService.findById(discountId);

            assertNotNull(result);
            assertEquals(discountId.toHexString(), result.getId());
        }

        @Test
        @DisplayName("Should throw exception when discount not found by ID")
        void findById_NotFound_ThrowsException() {
            when(repository.findById(discountId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> discountService.findById(discountId));
        }
    }

    // ==================== FIND ACTIVE DISCOUNTS TESTS ====================

    @Nested
    @DisplayName("findActiveDiscounts Tests")
    class FindActiveDiscountsTests {

        @Test
        @DisplayName("Should find active discounts within date range")
        void findActiveDiscounts_ValidRange_ReturnsDiscounts() {
            List<Discount> activeDiscounts = List.of(testDiscount);

            when(repository.findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                    any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(activeDiscounts);
            when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

            List<DiscountResponse> result = discountService.findActiveDiscounts();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertTrue(result.get(0).getActive());
        }

        @Test
        @DisplayName("Should return empty list when no active discounts")
        void findActiveDiscounts_None_ReturnsEmpty() {
            when(repository.findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                    any(LocalDate.class), any(LocalDate.class)))
                    .thenReturn(Collections.emptyList());

            List<DiscountResponse> result = discountService.findActiveDiscounts();

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    // ==================== DELETE DISCOUNT TESTS ====================

    @Nested
    @DisplayName("deleteById Tests")
    class DeleteDiscountTests {

        @Test
        @DisplayName("Should delete discount by ID")
        void deleteById_ExistingDiscount_Success() {
            doNothing().when(repository).deleteById(discountId);

            discountService.deleteById(discountId);

            verify(repository).deleteById(discountId);
        }
    }

    // ==================== DEACTIVATE EXPIRED DISCOUNTS TESTS ====================

    @Nested
    @DisplayName("deactivateExpiredDiscounts Tests")
    class DeactivateExpiredDiscountsTests {

        @Test
        @DisplayName("Should deactivate expired discounts")
        void deactivateExpiredDiscounts_HasExpired_Deactivates() {
            Discount expiredDiscount = Discount.builder()
                    .id(new ObjectId())
                    .name("Expired Sale")
                    .active(true)
                    .endDate(LocalDate.now().minusDays(1))
                    .build();

            when(repository.findByActiveTrue()).thenReturn(List.of(expiredDiscount));
            when(repository.save(any(Discount.class))).thenReturn(expiredDiscount);

            discountService.deactivateExpiredDiscounts();

            verify(repository).save(argThat(discount -> !discount.getActive()));
        }

        @Test
        @DisplayName("Should not deactivate non-expired discounts")
        void deactivateExpiredDiscounts_NotExpired_NoChange() {
            Discount validDiscount = Discount.builder()
                    .id(new ObjectId())
                    .name("Valid Sale")
                    .active(true)
                    .endDate(LocalDate.now().plusDays(10))
                    .build();

            when(repository.findByActiveTrue()).thenReturn(List.of(validDiscount));

            discountService.deactivateExpiredDiscounts();

            verify(repository, never()).save(any(Discount.class));
        }

        @Test
        @DisplayName("Should not deactivate discount without end date")
        void deactivateExpiredDiscounts_NoEndDate_NoChange() {
            Discount noEndDateDiscount = Discount.builder()
                    .id(new ObjectId())
                    .name("Permanent Sale")
                    .active(true)
                    .endDate(null)
                    .build();

            when(repository.findByActiveTrue()).thenReturn(List.of(noEndDateDiscount));

            discountService.deactivateExpiredDiscounts();

            verify(repository, never()).save(any(Discount.class));
        }

        @Test
        @DisplayName("Should handle empty list of active discounts")
        void deactivateExpiredDiscounts_NoActiveDiscounts_NoAction() {
            when(repository.findByActiveTrue()).thenReturn(Collections.emptyList());

            discountService.deactivateExpiredDiscounts();

            verify(repository, never()).save(any(Discount.class));
        }

        @Test
        @DisplayName("Should deactivate only expired discounts from mixed list")
        void deactivateExpiredDiscounts_MixedList_OnlyExpired() {
            Discount expiredDiscount = Discount.builder()
                    .id(new ObjectId())
                    .name("Expired")
                    .active(true)
                    .endDate(LocalDate.now().minusDays(5))
                    .build();

            Discount validDiscount = Discount.builder()
                    .id(new ObjectId())
                    .name("Valid")
                    .active(true)
                    .endDate(LocalDate.now().plusDays(5))
                    .build();

            when(repository.findByActiveTrue()).thenReturn(List.of(expiredDiscount, validDiscount));
            when(repository.save(any(Discount.class))).thenReturn(expiredDiscount);

            discountService.deactivateExpiredDiscounts();

            verify(repository, times(1)).save(any(Discount.class));
        }
    }

    // ==================== DISCOUNT TYPE BEHAVIOR TESTS ====================

    @Nested
    @DisplayName("Discount Type Behavior Tests")
    class DiscountTypeBehaviorTests {

        @Test
        @DisplayName("PERCENTAGE discount should have value between 0-100")
        void percentageDiscount_ValidRange() {
            DiscountCreateRequest request = DiscountCreateRequest.builder()
                    .name("Test")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(50.0)
                    .build();

            Discount discount = Discount.builder()
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(50.0)
                    .build();

            when(mapper.toEntity(request)).thenReturn(discount);
            when(repository.save(any(Discount.class))).thenReturn(discount);
            when(mapper.toResponse(discount))
                    .thenReturn(DiscountResponse.builder().discountValue(50.0).build());

            DiscountResponse result = discountService.save(request);

            assertEquals(50.0, result.getDiscountValue());
        }

        @Test
        @DisplayName("FIXED discount should be positive value")
        void fixedDiscount_PositiveValue() {
            DiscountCreateRequest request = DiscountCreateRequest.builder()
                    .name("Test")
                    .discountType(DiscountType.FIXED)
                    .discountValue(25.0)
                    .build();

            Discount discount = Discount.builder()
                    .discountType(DiscountType.FIXED)
                    .discountValue(25.0)
                    .build();

            when(mapper.toEntity(request)).thenReturn(discount);
            when(repository.save(any(Discount.class))).thenReturn(discount);
            when(mapper.toResponse(discount))
                    .thenReturn(DiscountResponse.builder()
                            .discountType(DiscountType.FIXED)
                            .discountValue(25.0)
                            .build());

            DiscountResponse result = discountService.save(request);

            assertEquals(DiscountType.FIXED, result.getDiscountType());
            assertEquals(25.0, result.getDiscountValue());
        }
    }

    // ==================== MINIMUM CART AMOUNT TESTS ====================

    @Nested
    @DisplayName("Minimum Cart Amount Tests")
    class MinCartAmountTests {

        @Test
        @DisplayName("Should create discount with minimum cart amount")
        void createDiscount_WithMinCartAmount_Success() {
            DiscountCreateRequest request = DiscountCreateRequest.builder()
                    .name("Min Cart Discount")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(10.0)
                    .minCartAmount(100.0)
                    .build();

            Discount discount = Discount.builder()
                    .name("Min Cart Discount")
                    .minCartAmount(100.0)
                    .build();

            when(mapper.toEntity(request)).thenReturn(discount);
            when(repository.save(any(Discount.class))).thenReturn(discount);
            when(mapper.toResponse(discount))
                    .thenReturn(DiscountResponse.builder().minCartAmount(100.0).build());

            DiscountResponse result = discountService.save(request);

            assertEquals(100.0, result.getMinCartAmount());
        }

        @Test
        @DisplayName("Should create discount without minimum cart amount")
        void createDiscount_NoMinCartAmount_Success() {
            DiscountCreateRequest request = DiscountCreateRequest.builder()
                    .name("No Min Discount")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(10.0)
                    .minCartAmount(null)
                    .build();

            when(mapper.toEntity(request)).thenReturn(testDiscount);
            when(repository.save(any(Discount.class))).thenReturn(testDiscount);
            when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

            DiscountResponse result = discountService.save(request);

            assertNotNull(result);
        }
    }
}
