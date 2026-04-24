package esprit_market.service.marketplaceService;

import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import esprit_market.entity.marketplace.Product;
import esprit_market.Enum.marketplaceEnum.ProductStatus;
import esprit_market.entity.user.User;
import esprit_market.mappers.marketplace.ProductMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProductService
 * Tests CRUD operations, business logic, and security
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Product Service Tests")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductMapper productMapper;

    @Mock
    private esprit_market.repository.marketplaceRepository.ProductCategoryRepository productCategoryRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private ProductService productService;

    private ObjectId userId;
    private ObjectId productId;
    private ObjectId shopId;
    private User mockUser;
    private Product mockProduct;
    private ProductRequestDTO mockRequestDTO;
    private ProductResponseDTO mockResponseDTO;

    @BeforeEach
    void setUp() {
        userId = new ObjectId();
        productId = new ObjectId();
        shopId = new ObjectId();

        // Setup mock user
        mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail("seller@test.com");
        mockUser.setFirstName("John");
        mockUser.setLastName("Doe");

        // Setup mock product
        mockProduct = new Product();
        mockProduct.setId(productId);
        mockProduct.setName("Test Product");
        mockProduct.setDescription("Test Description");
        mockProduct.setPrice(100.0);
        mockProduct.setStock(10);
        mockProduct.setShopId(shopId);
        mockProduct.setStatus(ProductStatus.APPROVED);

        // Setup mock DTOs
        mockRequestDTO = new ProductRequestDTO();
        mockRequestDTO.setName("Test Product");
        mockRequestDTO.setDescription("Test Description");
        mockRequestDTO.setPrice(100.0);
        mockRequestDTO.setStock(10);
        mockRequestDTO.setShopId(shopId.toHexString());

        mockResponseDTO = new ProductResponseDTO();
        mockResponseDTO.setId(productId.toHexString());
        mockResponseDTO.setName("Test Product");
        mockResponseDTO.setPrice(100.0);
    }

    // ==================== CREATE TESTS ====================

    @Test
    @DisplayName("Should create product successfully")
    void testCreateProduct_Success() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(productMapper.toEntity(mockRequestDTO)).thenReturn(mockProduct);
        when(productRepository.save(any(Product.class))).thenReturn(mockProduct);
        when(productMapper.toDTO(mockProduct)).thenReturn(mockResponseDTO);

        // Act
        ProductResponseDTO result = productService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        assertEquals(mockResponseDTO.getName(), result.getName());
        verify(productRepository, times(1)).save(any(Product.class));
        verify(productMapper, times(1)).toEntity(mockRequestDTO);
        verify(productMapper, times(1)).toDTO(mockProduct);
    }

    @Test
    @DisplayName("Should set default status to PENDING when creating product")
    void testCreateProduct_DefaultStatus() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        Product productWithoutStatus = new Product();
        productWithoutStatus.setName("Test");
        when(productMapper.toEntity(mockRequestDTO)).thenReturn(productWithoutStatus);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product saved = invocation.getArgument(0);
            assertEquals(ProductStatus.PENDING, saved.getStatus());
            return saved;
        });
        when(productMapper.toDTO(any(Product.class))).thenReturn(mockResponseDTO);

        // Act
        productService.create(mockRequestDTO);

        // Assert
        verify(productRepository).save(argThat(product -> 
            product.getStatus() == ProductStatus.PENDING
        ));
    }

    // ==================== READ TESTS ====================

    @Test
    @DisplayName("Should retrieve all products")
    void testFindAll_Success() {
        // Arrange
        List<Product> products = Arrays.asList(mockProduct);
        when(productRepository.findAll()).thenReturn(products);
        when(productMapper.toDTO(mockProduct)).thenReturn(mockResponseDTO);

        // Act
        List<ProductResponseDTO> result = productService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should retrieve product by ID")
    void testFindById_Success() {
        // Arrange
        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        when(productMapper.toDTO(mockProduct)).thenReturn(mockResponseDTO);

        // Act
        ProductResponseDTO result = productService.findById(productId);

        // Assert
        assertNotNull(result);
        assertEquals(mockResponseDTO.getId(), result.getId());
        verify(productRepository, times(1)).findById(productId);
    }

    @Test
    @DisplayName("Should throw exception when product not found")
    void testFindById_NotFound() {
        // Arrange
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            productService.findById(productId);
        });
        verify(productRepository, times(1)).findById(productId);
    }

    @Test
    @DisplayName("Should retrieve products by seller")
    void testFindBySeller_Success() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("seller@test.com");
        SecurityContextHolder.setContext(securityContext);
        
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(userRepository.findByEmail("seller@test.com")).thenReturn(Optional.of(mockUser));
        when(shopRepository.findByOwnerId(userId)).thenReturn(Optional.of(mockShop));
        when(productRepository.findByShopId(shopId)).thenReturn(Arrays.asList(mockProduct));
        when(productMapper.toDTO(mockProduct)).thenReturn(mockResponseDTO);

        // Act
        List<ProductResponseDTO> result = productService.findForCurrentSeller();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(userRepository, times(1)).findByEmail("seller@test.com");
    }

    // ==================== UPDATE TESTS ====================

    @Test
    @DisplayName("Should update product successfully")
    void testUpdate_Success() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        doNothing().when(productCategoryRepository).deleteByProductId(productId);
        when(productRepository.save(any(Product.class))).thenReturn(mockProduct);
        when(productMapper.toDTO(mockProduct)).thenReturn(mockResponseDTO);

        mockRequestDTO.setName("Updated Product");
        mockRequestDTO.setPrice(150.0);

        // Act
        ProductResponseDTO result = productService.update(productId, mockRequestDTO);

        // Assert
        assertNotNull(result);
        verify(productRepository, times(1)).findById(productId);
        verify(productRepository, times(1)).save(any(Product.class));
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent product")
    void testUpdate_NotFound() {
        // Arrange
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            productService.update(productId, mockRequestDTO);
        });
        verify(productRepository, times(1)).findById(productId);
        verify(productRepository, never()).save(any(Product.class));
    }

    // ==================== DELETE TESTS ====================

    @Test
    @DisplayName("Should delete product successfully")
    void testDelete_Success() {
        // Arrange
        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        doNothing().when(productCategoryRepository).deleteByProductId(productId);
        doNothing().when(productRepository).deleteById(productId);

        // Act
        productService.deleteById(productId);

        // Assert
        verify(productRepository, times(1)).findById(productId);
        verify(productRepository, times(1)).deleteById(productId);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent product")
    void testDelete_NotFound() {
        // Arrange
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            productService.deleteById(productId);
        });
        verify(productRepository, times(1)).findById(productId);
        verify(productRepository, never()).deleteById(any(ObjectId.class));
    }

    // ==================== BUSINESS LOGIC TESTS ====================

    @Test
    @DisplayName("Should update stock when updating product")
    void testUpdateStock() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        mockProduct.setStock(5);
        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        doNothing().when(productCategoryRepository).deleteByProductId(productId);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
            Product saved = invocation.getArgument(0);
            assertEquals(5, saved.getStock());
            return saved;
        });
        when(productMapper.toDTO(any(Product.class))).thenReturn(mockResponseDTO);

        mockRequestDTO.setStock(5);

        // Act
        productService.update(productId, mockRequestDTO);

        // Assert
        verify(productRepository).save(argThat(product -> 
            product.getStock() == 5
        ));
    }

    @Test
    @DisplayName("Should validate category exists before creating product")
    void testCreate_ValidateCategory() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        ObjectId categoryId = new ObjectId();
        mockRequestDTO.setCategoryIds(Arrays.asList(categoryId.toHexString()));
        
        esprit_market.entity.marketplace.Category mockCategory = new esprit_market.entity.marketplace.Category();
        mockCategory.setId(categoryId);
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(mockCategory));
        when(categoryRepository.save(any(esprit_market.entity.marketplace.Category.class))).thenReturn(mockCategory);
        when(productMapper.toEntity(mockRequestDTO)).thenReturn(mockProduct);
        when(productRepository.save(any(Product.class))).thenReturn(mockProduct);
        when(productMapper.toDTO(mockProduct)).thenReturn(mockResponseDTO);
        when(productCategoryRepository.save(any(esprit_market.entity.marketplace.ProductCategory.class))).thenReturn(null);

        // Act
        ProductResponseDTO result = productService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        verify(categoryRepository, times(1)).findById(categoryId);
    }

    // ==================== EDGE CASES ====================

    @Test
    @DisplayName("Should return empty list when no products exist")
    void testFindAll_EmptyList() {
        // Arrange
        when(productRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<ProductResponseDTO> result = productService.findAll();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(productRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should handle invalid ObjectId format")
    void testFindById_InvalidId() {
        // Arrange
        ObjectId invalidId = new ObjectId();
        when(productRepository.findById(invalidId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            productService.findById(invalidId);
        });
    }
}
