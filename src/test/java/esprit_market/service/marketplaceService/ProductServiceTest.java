package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ProductMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductCategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository repository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ProductCategoryRepository productCategoryRepository;
    @Mock
    private ProductMapper mapper;

    @InjectMocks
    private ProductService productService;

    private ObjectId productId;
    private ObjectId shopId;
    private ObjectId categoryId;
    private Product product;
    private Shop shop;
    private Category category;
    private ProductRequestDTO productRequestDTO;
    private ProductResponseDTO productResponseDTO;

    @BeforeEach
    void setUp() {
        productId = new ObjectId();
        shopId = new ObjectId();
        categoryId = new ObjectId();

        product = new Product();
        product.setId(productId);
        product.setName("Test Product");
        product.setShopId(shopId);

        shop = new Shop();
        shop.setId(shopId);

        category = new Category();
        category.setId(categoryId);
        category.setProductIds(new ArrayList<>());

        productRequestDTO = new ProductRequestDTO();
        productRequestDTO.setName("Test Product");
        productRequestDTO.setShopId(shopId.toHexString());
        productRequestDTO.setCategoryIds(Collections.singletonList(categoryId.toHexString()));

        productResponseDTO = new ProductResponseDTO();
        productResponseDTO.setId(productId.toHexString());
        productResponseDTO.setName("Test Product");
    }

    @Test
    void findAll_ShouldReturnList() {
        when(repository.findAll()).thenReturn(Collections.singletonList(product));
        when(mapper.toDTO(product)).thenReturn(productResponseDTO);

        List<ProductResponseDTO> result = productService.findAll();

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenExists_ShouldReturnDTO() {
        when(repository.findById(productId)).thenReturn(Optional.of(product));
        when(mapper.toDTO(product)).thenReturn(productResponseDTO);

        ProductResponseDTO result = productService.findById(productId);

        assertNotNull(result);
        verify(repository, times(1)).findById(productId);
    }

    @Test
    void create_WhenValid_ShouldReturnDTO() {
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));
        when(mapper.toEntity(productRequestDTO)).thenReturn(product);
        when(repository.save(any(Product.class))).thenReturn(product);
        when(mapper.toDTO(product)).thenReturn(productResponseDTO);

        ProductResponseDTO result = productService.create(productRequestDTO);

        assertNotNull(result);
        verify(shopRepository, times(1)).findById(shopId);
        verify(categoryRepository, times(1)).findById(categoryId);
        verify(repository, times(1)).save(any(Product.class));
        verify(categoryRepository, times(1)).save(category);
        verify(productCategoryRepository, times(1)).save(any());
    }

    @Test
    void create_WhenShopNotFound_ShouldThrowException() {
        when(shopRepository.findById(shopId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> productService.create(productRequestDTO));
    }

    @Test
    void deleteById_WhenExists_ShouldDelete() {
        product.setCategoryIds(Collections.singletonList(categoryId));
        when(repository.findById(productId)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(category));

        productService.deleteById(productId);

        verify(categoryRepository, times(1)).save(category);
        verify(productCategoryRepository, times(1)).deleteByProductId(productId);
        verify(repository, times(1)).deleteById(productId);
    }
}
