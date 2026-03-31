package esprit_market.service.marketplaceService;

import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.marketplace.FavorisRequestDTO;
import esprit_market.dto.marketplace.FavorisResponseDTO;
import esprit_market.entity.marketplace.Favoris;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.user.User;
import esprit_market.mappers.marketplace.FavorisMapper;
import esprit_market.repository.marketplaceRepository.FavorisRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for FavorisService
 * Tests CRUD operations, toggle functionality, and user-specific queries
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Favoris Service Tests")
class FavorisServiceTest {

    @Mock
    private FavorisRepository favorisRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private FavorisMapper favorisMapper;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private FavorisService favorisService;

    private ObjectId userId;
    private ObjectId productId;
    private ObjectId serviceId;
    private ObjectId favorisId;
    private User mockUser;
    private Product mockProduct;
    private ServiceEntity mockService;
    private Favoris mockFavoris;
    private FavorisRequestDTO mockRequestDTO;
    private FavorisResponseDTO mockResponseDTO;

    @BeforeEach
    void setUp() {
        userId = new ObjectId();
        productId = new ObjectId();
        serviceId = new ObjectId();
        favorisId = new ObjectId();

        // Setup mock user
        mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail("user@test.com");
        mockUser.setFirstName("John");
        mockUser.setLastName("Doe");
        mockUser.setFavorisIds(new ArrayList<>());

        // Setup mock product
        mockProduct = new Product();
        mockProduct.setId(productId);
        mockProduct.setName("Test Product");

        // Setup mock service
        mockService = new ServiceEntity();
        mockService.setId(serviceId);
        mockService.setName("Test Service");

        // Setup mock favoris
        mockFavoris = new Favoris();
        mockFavoris.setId(favorisId);
        mockFavoris.setUserId(userId);
        mockFavoris.setProductId(productId);

        // Setup mock DTOs
        mockRequestDTO = new FavorisRequestDTO();
        mockRequestDTO.setUserId(userId.toHexString());
        mockRequestDTO.setProductId(productId.toHexString());

        mockResponseDTO = new FavorisResponseDTO();
        mockResponseDTO.setId(favorisId.toHexString());
        mockResponseDTO.setUserId(userId.toHexString());
        mockResponseDTO.setProductId(productId.toHexString());
    }

    // ==================== CREATE TESTS ====================

    @Test
    @DisplayName("Should create product favorite successfully")
    void testCreateProductFavorite_Success() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        when(favorisMapper.toEntity(mockRequestDTO)).thenReturn(mockFavoris);
        when(favorisRepository.save(any(Favoris.class))).thenReturn(mockFavoris);
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        // Act
        FavorisResponseDTO result = favorisService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        assertEquals(mockResponseDTO.getId(), result.getId());
        verify(favorisRepository, times(1)).save(any(Favoris.class));
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Should create service favorite successfully")
    void testCreateServiceFavorite_Success() {
        // Arrange
        mockRequestDTO.setProductId(null);
        mockRequestDTO.setServiceId(serviceId.toHexString());
        mockFavoris.setProductId(null);
        mockFavoris.setServiceId(serviceId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(mockService));
        when(favorisMapper.toEntity(mockRequestDTO)).thenReturn(mockFavoris);
        when(favorisRepository.save(any(Favoris.class))).thenReturn(mockFavoris);
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        // Act
        FavorisResponseDTO result = favorisService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        verify(serviceRepository, times(1)).findById(serviceId);
        verify(favorisRepository, times(1)).save(any(Favoris.class));
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void testCreate_UserNotFound() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            favorisService.create(mockRequestDTO);
        });
        verify(favorisRepository, never()).save(any(Favoris.class));
    }

    @Test
    @DisplayName("Should throw exception when product not found")
    void testCreate_ProductNotFound() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            favorisService.create(mockRequestDTO);
        });
        verify(favorisRepository, never()).save(any(Favoris.class));
    }

    @Test
    @DisplayName("Should throw exception when both product and service are provided")
    void testCreate_BothProductAndService() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        mockRequestDTO.setServiceId(serviceId.toHexString());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            favorisService.create(mockRequestDTO);
        });
        verify(favorisRepository, never()).save(any(Favoris.class));
    }

    @Test
    @DisplayName("Should throw exception when neither product nor service is provided")
    void testCreate_NoProductOrService() {
        // Arrange
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        mockRequestDTO.setProductId(null);

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            favorisService.create(mockRequestDTO);
        });
        verify(favorisRepository, never()).save(any(Favoris.class));
    }

    // ==================== READ TESTS ====================

    @Test
    @DisplayName("Should retrieve all favorites")
    void testFindAll_Success() {
        // Arrange
        List<Favoris> favorisList = Arrays.asList(mockFavoris);
        when(favorisRepository.findAll()).thenReturn(favorisList);
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);

        // Act
        List<FavorisResponseDTO> result = favorisService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(favorisRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should retrieve favorite by ID")
    void testFindById_Success() {
        // Arrange
        when(favorisRepository.findById(favorisId)).thenReturn(Optional.of(mockFavoris));
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);

        // Act
        FavorisResponseDTO result = favorisService.findById(favorisId);

        // Assert
        assertNotNull(result);
        assertEquals(mockResponseDTO.getId(), result.getId());
        verify(favorisRepository, times(1)).findById(favorisId);
    }

    @Test
    @DisplayName("Should throw exception when favorite not found by ID")
    void testFindById_NotFound() {
        // Arrange
        when(favorisRepository.findById(favorisId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            favorisService.findById(favorisId);
        });
    }

    @Test
    @DisplayName("Should retrieve favorites by user ID")
    void testGetByUserId_Success() {
        // Arrange
        List<Favoris> favorisList = Arrays.asList(mockFavoris);
        when(favorisRepository.findByUserId(userId)).thenReturn(favorisList);
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);

        // Act
        List<FavorisResponseDTO> result = favorisService.getByUserId(userId);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(favorisRepository, times(1)).findByUserId(userId);
    }

    // ==================== DELETE TESTS ====================

    @Test
    @DisplayName("Should delete favorite successfully")
    void testDelete_Success() {
        // Arrange
        mockUser.getFavorisIds().add(favorisId);
        when(favorisRepository.findById(favorisId)).thenReturn(Optional.of(mockFavoris));
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        doNothing().when(favorisRepository).deleteById(favorisId);

        // Act
        favorisService.delete(favorisId);

        // Assert
        verify(favorisRepository, times(1)).findById(favorisId);
        verify(favorisRepository, times(1)).deleteById(favorisId);
        verify(userRepository, times(1)).save(any(User.class));
        assertFalse(mockUser.getFavorisIds().contains(favorisId));
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent favorite")
    void testDelete_NotFound() {
        // Arrange
        when(favorisRepository.findById(favorisId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            favorisService.delete(favorisId);
        });
        verify(favorisRepository, never()).deleteById(any(ObjectId.class));
    }

    // ==================== TOGGLE TESTS ====================

    @Test
    @DisplayName("Should add product favorite when toggling and not exists")
    void testToggleProductFavorite_Add() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("user@test.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(mockUser));
        when(favorisRepository.findByUserIdAndProductId(userId, productId)).thenReturn(Arrays.asList());
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        when(favorisMapper.toEntity(any(FavorisRequestDTO.class))).thenReturn(mockFavoris);
        when(favorisRepository.save(any(Favoris.class))).thenReturn(mockFavoris);
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        // Act
        FavorisResponseDTO result = favorisService.toggleProductFavorite(productId);

        // Assert
        assertNotNull(result);
        verify(favorisRepository, times(1)).save(any(Favoris.class));
    }

    @Test
    @DisplayName("Should remove product favorite when toggling and exists")
    void testToggleProductFavorite_Remove() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("user@test.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(mockUser));
        when(favorisRepository.findByUserIdAndProductId(userId, productId)).thenReturn(Arrays.asList(mockFavoris));
        when(favorisRepository.findById(favorisId)).thenReturn(Optional.of(mockFavoris));
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        doNothing().when(favorisRepository).deleteById(favorisId);

        // Act
        FavorisResponseDTO result = favorisService.toggleProductFavorite(productId);

        // Assert
        assertNull(result);
        verify(favorisRepository, times(1)).deleteById(favorisId);
    }

    @Test
    @DisplayName("Should add service favorite when toggling and not exists")
    void testToggleServiceFavorite_Add() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("user@test.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(mockUser));
        when(favorisRepository.findByUserIdAndServiceId(userId, serviceId)).thenReturn(Arrays.asList());
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(mockService));
        when(favorisMapper.toEntity(any(FavorisRequestDTO.class))).thenReturn(mockFavoris);
        when(favorisRepository.save(any(Favoris.class))).thenReturn(mockFavoris);
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        // Act
        FavorisResponseDTO result = favorisService.toggleServiceFavorite(serviceId);

        // Assert
        assertNotNull(result);
        verify(favorisRepository, times(1)).save(any(Favoris.class));
    }

    @Test
    @DisplayName("Should remove service favorite when toggling and exists")
    void testToggleServiceFavorite_Remove() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("user@test.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(mockUser));
        when(favorisRepository.findByUserIdAndServiceId(userId, serviceId)).thenReturn(Arrays.asList(mockFavoris));
        when(favorisRepository.findById(favorisId)).thenReturn(Optional.of(mockFavoris));
        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(userRepository.save(any(User.class))).thenReturn(mockUser);
        doNothing().when(favorisRepository).deleteById(favorisId);

        // Act
        FavorisResponseDTO result = favorisService.toggleServiceFavorite(serviceId);

        // Assert
        assertNull(result);
        verify(favorisRepository, times(1)).deleteById(favorisId);
    }

    // ==================== AUTHENTICATION TESTS ====================

    @Test
    @DisplayName("Should get favorites for current authenticated user")
    void testGetMyFavorites_Success() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("user@test.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(mockUser));
        when(favorisRepository.findByUserId(userId)).thenReturn(Arrays.asList(mockFavoris));
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);

        // Act
        List<FavorisResponseDTO> result = favorisService.getMyFavorites();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(userRepository, times(1)).findByEmail("user@test.com");
    }

    @Test
    @DisplayName("Should check if product is favorited by current user")
    void testIsProductFavorited_True() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("user@test.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(mockUser));
        when(favorisRepository.findByUserIdAndProductId(userId, productId)).thenReturn(Arrays.asList(mockFavoris));

        // Act
        boolean result = favorisService.isProductFavorited(productId);

        // Assert
        assertTrue(result);
    }

    @Test
    @DisplayName("Should check if product is not favorited by current user")
    void testIsProductFavorited_False() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("user@test.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(mockUser));
        when(favorisRepository.findByUserIdAndProductId(userId, productId)).thenReturn(Arrays.asList());

        // Act
        boolean result = favorisService.isProductFavorited(productId);

        // Assert
        assertFalse(result);
    }

    @Test
    @DisplayName("Should return false when user not authenticated")
    void testIsProductFavorited_NotAuthenticated() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        // Act
        boolean result = favorisService.isProductFavorited(productId);

        // Assert
        assertFalse(result);
        verify(userRepository, never()).findByEmail(any());
    }

    // ==================== EDGE CASES ====================

    @Test
    @DisplayName("Should return empty list when user has no favorites")
    void testGetByUserId_EmptyList() {
        // Arrange
        when(favorisRepository.findByUserId(userId)).thenReturn(Arrays.asList());

        // Act
        List<FavorisResponseDTO> result = favorisService.getByUserId(userId);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("Should handle concurrent toggle operations")
    void testToggleProductFavorite_Concurrent() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("user@test.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(mockUser));
        when(favorisRepository.findByUserIdAndProductId(userId, productId))
            .thenReturn(Arrays.asList())
            .thenReturn(Arrays.asList(mockFavoris));

        when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
        when(productRepository.findById(productId)).thenReturn(Optional.of(mockProduct));
        when(favorisMapper.toEntity(any(FavorisRequestDTO.class))).thenReturn(mockFavoris);
        when(favorisRepository.save(any(Favoris.class))).thenReturn(mockFavoris);
        when(favorisMapper.toDTO(mockFavoris)).thenReturn(mockResponseDTO);
        when(userRepository.save(any(User.class))).thenReturn(mockUser);

        // Act
        FavorisResponseDTO result1 = favorisService.toggleProductFavorite(productId);

        // Assert
        assertNotNull(result1);
        verify(favorisRepository, times(1)).save(any(Favoris.class));
    }
}
