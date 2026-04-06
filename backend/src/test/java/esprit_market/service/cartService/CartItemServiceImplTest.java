package esprit_market.service.cartService;

import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.entity.cart.CartItem;
import esprit_market.mappers.cartMapper.CartItemMapper;
import esprit_market.repository.cartRepository.CartItemRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("CartItemServiceImpl Tests")
class CartItemServiceImplTest {

    @Mock
    private CartItemRepository repository;

    @Mock
    private CartItemMapper mapper;

    @InjectMocks
    private CartItemServiceImpl cartItemService;

    private ObjectId itemId;
    private ObjectId cartId;
    private ObjectId productId;
    private CartItem testItem;
    private CartItemResponse testResponse;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        itemId = new ObjectId();
        cartId = new ObjectId();
        productId = new ObjectId();

        testItem = CartItem.builder()
                .id(itemId)
                .cartId(cartId)
                .productId(productId)
                .productName("Test Product")
                .quantity(2)
                .unitPrice(100.0)
                .subTotal(200.0)
                .discountApplied(0.0)
                .build();

        testResponse = CartItemResponse.builder()
                .id(itemId.toHexString())
                .cartId(cartId.toHexString())
                .productId(productId.toHexString())
                .productName("Test Product")
                .quantity(2)
                .unitPrice(100.0)
                .subTotal(200.0)
                .build();
    }

    @Test
    @DisplayName("findAll_shouldReturnAllCartItems")
    void testFindAll_ShouldReturnAllCartItems() {
        List<CartItem> items = List.of(testItem);

        when(repository.findAll()).thenReturn(items);
        when(mapper.toResponse(testItem)).thenReturn(testResponse);

        List<CartItemResponse> result = cartItemService.findAll();

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        verify(repository).findAll();
    }

    @Test
    @DisplayName("findById_shouldReturnCartItem")
    void testFindById_ShouldReturnCartItem() {
        when(repository.findById(itemId)).thenReturn(Optional.of(testItem));
        when(mapper.toResponse(testItem)).thenReturn(testResponse);

        CartItemResponse result = cartItemService.findById(itemId);

        assertNotNull(result);
        assertEquals(testResponse.getId(), result.getId());
        verify(repository).findById(itemId);
    }

    @Test
    @DisplayName("findById_shouldThrowException_whenNotFound")
    void testFindById_ShouldThrowException_WhenNotFound() {
        when(repository.findById(itemId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> cartItemService.findById(itemId));
    }

    @Test
    @DisplayName("deleteById_shouldDeleteCartItem")
    void testDeleteById_ShouldDeleteCartItem() {
        cartItemService.deleteById(itemId);

        verify(repository).deleteById(itemId);
    }

    @Test
    @DisplayName("findByCartId_shouldReturnItemsForCart")
    void testFindByCartId_ShouldReturnItemsForCart() {
        List<CartItem> items = List.of(testItem);

        when(repository.findByCartId(cartId)).thenReturn(items);
        when(mapper.toResponse(testItem)).thenReturn(testResponse);

        List<CartItemResponse> result = cartItemService.findByCartId(cartId);

        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertEquals(1, result.size());
        verify(repository).findByCartId(cartId);
    }

    @Test
    @DisplayName("deleteByCartId_shouldDeleteAllItemsInCart")
    void testDeleteByCartId_ShouldDeleteAllItemsInCart() {
        List<CartItem> items = List.of(testItem);

        when(repository.findByCartId(cartId)).thenReturn(items);

        cartItemService.deleteByCartId(cartId);

        verify(repository).findByCartId(cartId);
        verify(repository).deleteAll(items);
    }
}
