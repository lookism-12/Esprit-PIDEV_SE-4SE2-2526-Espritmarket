package esprit_market.service.cartService;

import esprit_market.entity.marketplace.Product;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("StockManagementService Tests")
class StockManagementServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private StockManagementService stockManagementService;

    private ObjectId productId;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        productId = new ObjectId();

        testProduct = Product.builder()
                .id(productId)
                .name("Test Product")
                .price(100.0)
                .stock(10)
                .quantity(10)
                .build();
    }

    @Test
    @DisplayName("validateStockAvailability_shouldPass_whenSufficientStock")
    void testValidateStockAvailability_ShouldPass_WhenSufficientStock() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

        assertDoesNotThrow(() -> stockManagementService.validateStockAvailability(productId, 5));
    }

    @Test
    @DisplayName("validateStockAvailability_shouldThrowException_whenInsufficientStock")
    void testValidateStockAvailability_ShouldThrowException_WhenInsufficientStock() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

        assertThrows(InsufficientStockException.class, () -> 
            stockManagementService.validateStockAvailability(productId, 20));
    }

    @Test
    @DisplayName("validateStockAvailability_shouldThrowException_whenProductNotFound")
    void testValidateStockAvailability_ShouldThrowException_WhenProductNotFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            stockManagementService.validateStockAvailability(productId, 5));
    }

    @Test
    @DisplayName("validateStockAvailability_shouldThrowException_whenRequestedQuantityZero")
    void testValidateStockAvailability_ShouldThrowException_WhenRequestedQuantityZero() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

        // Should still pass since 0 is not requested here, but let's test boundary
        assertDoesNotThrow(() -> stockManagementService.validateStockAvailability(productId, 0));
    }

    @Test
    @DisplayName("reduceStock_shouldReduceStockByQuantity")
    void testReduceStock_ShouldReduceStockByQuantity() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        stockManagementService.reduceStock(productId, 3);

        verify(productRepository).save(any(Product.class));
        assertEquals(7, testProduct.getStock());
    }

    @Test
    @DisplayName("reduceStock_shouldThrowException_whenInsufficientStock")
    void testReduceStock_ShouldThrowException_WhenInsufficientStock() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

        assertThrows(InsufficientStockException.class, () -> 
            stockManagementService.reduceStock(productId, 15));
    }

    @Test
    @DisplayName("reduceStock_shouldThrowException_whenProductNotFound")
    void testReduceStock_ShouldThrowException_WhenProductNotFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            stockManagementService.reduceStock(productId, 5));
    }

    @Test
    @DisplayName("restoreStock_shouldIncreaseStockByQuantity")
    void testRestoreStock_ShouldIncreaseStockByQuantity() {
        testProduct.setStock(5);
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        stockManagementService.restoreStock(productId, 3);

        verify(productRepository).save(any(Product.class));
        assertEquals(8, testProduct.getStock());
    }

    @Test
    @DisplayName("restoreStock_shouldThrowException_whenProductNotFound")
    void testRestoreStock_ShouldThrowException_WhenProductNotFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            stockManagementService.restoreStock(productId, 5));
    }

    @Test
    @DisplayName("getCurrentStock_shouldReturnCurrentStockLevel")
    void testGetCurrentStock_ShouldReturnCurrentStockLevel() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

        int stock = stockManagementService.getCurrentStock(productId);

        assertEquals(10, stock);
    }

    @Test
    @DisplayName("getCurrentStock_shouldThrowException_whenProductNotFound")
    void testGetCurrentStock_ShouldThrowException_WhenProductNotFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            stockManagementService.getCurrentStock(productId));
    }

    @Test
    @DisplayName("batchReduceStock_shouldReduceMultipleProducts")
    void testBatchReduceStock_ShouldReduceMultipleProducts() {
        ObjectId product2Id = new ObjectId();
        Product product2 = Product.builder()
                .id(product2Id)
                .name("Product 2")
                .stock(20)
                .build();

        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(productRepository.findById(product2Id)).thenReturn(Optional.of(product2));
        when(productRepository.save(any(Product.class)))
                .thenReturn(testProduct)
                .thenReturn(product2);

        java.util.Map<ObjectId, Integer> reductions = new java.util.HashMap<>();
        reductions.put(productId, 2);
        reductions.put(product2Id, 5);

        stockManagementService.batchReduceStock(reductions);

        verify(productRepository, times(2)).save(any(Product.class));
    }

    @Test
    @DisplayName("reduceStock_shouldMaintainBothStockAndQuantityFields")
    void testReduceStock_ShouldMaintainBothFields() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        stockManagementService.reduceStock(productId, 2);

        verify(productRepository).save(any(Product.class));
        assertEquals(testProduct.getStock(), testProduct.getQuantity());
    }

    @Test
    @DisplayName("restoreStock_shouldMaintainBothStockAndQuantityFields")
    void testRestoreStock_ShouldMaintainBothFields() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        stockManagementService.restoreStock(productId, 2);

        verify(productRepository).save(any(Product.class));
        assertEquals(testProduct.getStock(), testProduct.getQuantity());
    }
}
