package esprit_market.service.marketplaceService;

import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.mappers.marketplace.ShopMapper;
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

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ShopService
 * Tests CRUD operations and business logic
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Shop Service Tests")
class ShopServiceTest {

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private esprit_market.repository.marketplaceRepository.ProductRepository productRepository;

    @Mock
    private ShopMapper shopMapper;

    @InjectMocks
    private ShopService shopService;

    private ObjectId ownerId;
    private ObjectId shopId;
    private User mockUser;
    private Shop mockShop;
    private ShopRequestDTO mockRequestDTO;
    private ShopResponseDTO mockResponseDTO;

    @BeforeEach
    void setUp() {
        ownerId = new ObjectId();
        shopId = new ObjectId();

        // Setup mock user
        mockUser = new User();
        mockUser.setId(ownerId);
        mockUser.setEmail("owner@test.com");
        mockUser.setFirstName("John");
        mockUser.setLastName("Doe");

        // Setup mock shop
        mockShop = new Shop();
        mockShop.setId(shopId);
        mockShop.setOwnerId(ownerId);
        mockShop.setName("Test Shop");
        mockShop.setDescription("Test Description");

        // Setup mock DTOs
        mockRequestDTO = new ShopRequestDTO();
        mockRequestDTO.setOwnerId(ownerId.toHexString());
        mockRequestDTO.setName("Test Shop");
        mockRequestDTO.setDescription("Test Description");

        mockResponseDTO = new ShopResponseDTO();
        mockResponseDTO.setId(shopId.toHexString());
        mockResponseDTO.setName("Test Shop");
        mockResponseDTO.setOwnerId(ownerId.toHexString());
    }

    // ==================== CREATE TESTS ====================

    @Test
    @DisplayName("Should create shop successfully")
    void testCreateShop_Success() {
        // Arrange
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(mockUser));
        when(shopMapper.toEntity(mockRequestDTO)).thenReturn(mockShop);
        when(shopRepository.save(any(Shop.class))).thenReturn(mockShop);
        when(productRepository.findByShopId(shopId)).thenReturn(Arrays.asList());
        when(shopMapper.toDTO(mockShop)).thenReturn(mockResponseDTO);

        // Act
        ShopResponseDTO result = shopService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        assertEquals(mockResponseDTO.getName(), result.getName());
        verify(shopRepository, times(1)).save(any(Shop.class));
        verify(userRepository, times(2)).findById(ownerId); // Called in create() and enrichShopDTO()
    }

    @Test
    @DisplayName("Should throw exception when owner not found")
    void testCreate_OwnerNotFound() {
        // Arrange
        when(userRepository.findById(ownerId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            shopService.create(mockRequestDTO);
        });
        verify(shopRepository, never()).save(any(Shop.class));
    }

    // ==================== READ TESTS ====================

    @Test
    @DisplayName("Should retrieve all shops")
    void testFindAll_Success() {
        // Arrange
        List<Shop> shops = Arrays.asList(mockShop);
        when(shopRepository.findAll()).thenReturn(shops);
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(mockUser));
        when(productRepository.findByShopId(shopId)).thenReturn(Arrays.asList());
        when(shopMapper.toDTO(mockShop)).thenReturn(mockResponseDTO);

        // Act
        List<ShopResponseDTO> result = shopService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(shopRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should retrieve shop by ID")
    void testFindById_Success() {
        // Arrange
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(mockUser));
        when(productRepository.findByShopId(shopId)).thenReturn(Arrays.asList());
        when(shopMapper.toDTO(mockShop)).thenReturn(mockResponseDTO);

        // Act
        ShopResponseDTO result = shopService.findById(shopId);

        // Assert
        assertNotNull(result);
        assertEquals(mockResponseDTO.getId(), result.getId());
        verify(shopRepository, times(1)).findById(shopId);
    }

    @Test
    @DisplayName("Should throw exception when shop not found")
    void testFindById_NotFound() {
        // Arrange
        when(shopRepository.findById(shopId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            shopService.findById(shopId);
        });
        verify(shopRepository, times(1)).findById(shopId);
    }

    // ==================== UPDATE TESTS ====================

    @Test
    @DisplayName("Should update shop successfully")
    void testUpdate_Success() {
        // Arrange
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(shopRepository.save(any(Shop.class))).thenReturn(mockShop);
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(mockUser));
        when(productRepository.findByShopId(shopId)).thenReturn(Arrays.asList());
        when(shopMapper.toDTO(mockShop)).thenReturn(mockResponseDTO);

        mockRequestDTO.setName("Updated Shop");

        // Act
        ShopResponseDTO result = shopService.update(shopId, mockRequestDTO);

        // Assert
        assertNotNull(result);
        verify(shopRepository, times(1)).findById(shopId);
        verify(shopRepository, times(1)).save(any(Shop.class));
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent shop")
    void testUpdate_NotFound() {
        // Arrange
        when(shopRepository.findById(shopId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            shopService.update(shopId, mockRequestDTO);
        });
        verify(shopRepository, times(1)).findById(shopId);
        verify(shopRepository, never()).save(any(Shop.class));
    }

    // ==================== DELETE TESTS ====================

    @Test
    @DisplayName("Should delete shop successfully")
    void testDelete_Success() {
        // Arrange
        when(shopRepository.existsById(shopId)).thenReturn(true);
        doNothing().when(shopRepository).deleteById(shopId);

        // Act
        shopService.deleteById(shopId);

        // Assert
        verify(shopRepository, times(1)).existsById(shopId);
        verify(shopRepository, times(1)).deleteById(shopId);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent shop")
    void testDelete_NotFound() {
        // Arrange
        when(shopRepository.existsById(shopId)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            shopService.deleteById(shopId);
        });
        verify(shopRepository, times(1)).existsById(shopId);
        verify(shopRepository, never()).deleteById(any(ObjectId.class));
    }

    // ==================== BUSINESS LOGIC TESTS ====================

    @Test
    @DisplayName("Should preserve ownerId when updating shop")
    void testUpdate_PreserveOwnerId() {
        // Arrange
        ObjectId originalOwnerId = new ObjectId();
        mockShop.setOwnerId(originalOwnerId);
        mockRequestDTO.setOwnerId(originalOwnerId.toHexString()); // Use same ownerId
        
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(userRepository.findById(originalOwnerId)).thenReturn(Optional.of(mockUser));
        when(shopRepository.save(any(Shop.class))).thenAnswer(invocation -> {
            Shop saved = invocation.getArgument(0);
            assertEquals(originalOwnerId, saved.getOwnerId());
            return saved;
        });
        when(productRepository.findByShopId(shopId)).thenReturn(Arrays.asList());
        when(shopMapper.toDTO(any(Shop.class))).thenReturn(mockResponseDTO);

        // Act
        shopService.update(shopId, mockRequestDTO);

        // Assert
        verify(shopRepository).save(argThat(shop -> 
            shop.getOwnerId().equals(originalOwnerId)
        ));
    }

    // ==================== EDGE CASES ====================

    @Test
    @DisplayName("Should return empty list when no shops exist")
    void testFindAll_EmptyList() {
        // Arrange
        when(shopRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<ShopResponseDTO> result = shopService.findAll();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(shopRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should handle null description gracefully")
    void testCreate_NullDescription() {
        // Arrange
        mockRequestDTO.setDescription(null);
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(mockUser));
        when(shopMapper.toEntity(mockRequestDTO)).thenReturn(mockShop);
        when(shopRepository.save(any(Shop.class))).thenReturn(mockShop);
        when(productRepository.findByShopId(shopId)).thenReturn(Arrays.asList());
        when(shopMapper.toDTO(mockShop)).thenReturn(mockResponseDTO);

        // Act
        ShopResponseDTO result = shopService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        verify(shopRepository, times(1)).save(any(Shop.class));
    }
}
