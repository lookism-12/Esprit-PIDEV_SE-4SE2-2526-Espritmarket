package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.dto.cartDto.DiscountCreateRequest;
import esprit_market.dto.cartDto.DiscountResponse;
import esprit_market.dto.cartDto.DiscountUpdateRequest;
import esprit_market.entity.cart.Discount;
import esprit_market.mappers.cartMapper.DiscountMapper;
import esprit_market.repository.cartRepository.DiscountRepository;
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

@DisplayName("DiscountServiceImpl Tests")
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
        MockitoAnnotations.openMocks(this);

        discountId = new ObjectId();

        testDiscount = Discount.builder()
                .id(discountId)
                .name("Spring Sale")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(20.0)
                .active(true)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(30))
                .build();

        testResponse = DiscountResponse.builder()
                .id(discountId.toHexString())
                .name("Spring Sale")
                .build();
    }

    @Test
    @DisplayName("save_shouldCreateNewDiscount")
    void testSave_ShouldCreateNewDiscount() {
        DiscountCreateRequest request = new DiscountCreateRequest();
        request.setName("Spring Sale");

        when(mapper.toEntity(request)).thenReturn(testDiscount);
        when(repository.save(testDiscount)).thenReturn(testDiscount);
        when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

        DiscountResponse result = discountService.save(request);

        assertNotNull(result);
        verify(repository).save(testDiscount);
    }

    @Test
    @DisplayName("save_shouldThrowException_whenEndDateBeforeStartDate")
    void testSave_ShouldThrowException_WhenEndDateBeforeStartDate() {
        DiscountCreateRequest request = new DiscountCreateRequest();
        request.setStartDate(LocalDate.now().plusDays(10));
        request.setEndDate(LocalDate.now());

        assertThrows(IllegalArgumentException.class, () -> discountService.save(request));
    }

    @Test
    @DisplayName("update_shouldUpdateExistingDiscount")
    void testUpdate_ShouldUpdateExistingDiscount() {
        DiscountUpdateRequest request = new DiscountUpdateRequest();

        when(repository.findById(discountId)).thenReturn(Optional.of(testDiscount));
        when(repository.save(testDiscount)).thenReturn(testDiscount);
        when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

        DiscountResponse result = discountService.update(discountId, request);

        assertNotNull(result);
        verify(repository).findById(discountId);
        verify(repository).save(testDiscount);
    }

    @Test
    @DisplayName("update_shouldThrowException_whenNotFound")
    void testUpdate_ShouldThrowException_WhenNotFound() {
        DiscountUpdateRequest request = new DiscountUpdateRequest();

        when(repository.findById(discountId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> discountService.update(discountId, request));
    }

    @Test
    @DisplayName("findAll_shouldReturnAllDiscounts")
    void testFindAll_ShouldReturnAllDiscounts() {
        List<Discount> discounts = List.of(testDiscount);

        when(repository.findAll()).thenReturn(discounts);
        when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

        List<DiscountResponse> result = discountService.findAll();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        verify(repository).findAll();
    }

    @Test
    @DisplayName("findById_shouldReturnDiscount")
    void testFindById_ShouldReturnDiscount() {
        when(repository.findById(discountId)).thenReturn(Optional.of(testDiscount));
        when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

        DiscountResponse result = discountService.findById(discountId);

        assertNotNull(result);
        verify(repository).findById(discountId);
    }

    @Test
    @DisplayName("findById_shouldThrowException_whenNotFound")
    void testFindById_ShouldThrowException_WhenNotFound() {
        when(repository.findById(discountId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> discountService.findById(discountId));
    }

    @Test
    @DisplayName("findActiveDiscounts_shouldReturnOnlyActiveDiscounts")
    void testFindActiveDiscounts_ShouldReturnOnlyActiveDiscounts() {
        List<Discount> activeDiscounts = List.of(testDiscount);

        when(repository.findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                any(LocalDate.class), any(LocalDate.class))).thenReturn(activeDiscounts);
        when(mapper.toResponse(testDiscount)).thenReturn(testResponse);

        List<DiscountResponse> result = discountService.findActiveDiscounts();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        verify(repository).findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                any(LocalDate.class), any(LocalDate.class));
    }
}
