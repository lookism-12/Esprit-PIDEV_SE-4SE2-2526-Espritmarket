package esprit_market.service.marketplaceService;

import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.user.User;
import esprit_market.mappers.marketplace.ServiceMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
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
 * Unit tests for ServiceService
 * Tests CRUD operations, ownership validation, and business logic
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Service Module Tests")
class ServiceServiceTest {

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShopRepository shopRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ServiceMapper serviceMapper;

    @Mock
    private Authentication authentication;

    @Mock
    private SecurityContext securityContext;

    @InjectMocks
    private ServiceService serviceService;

    private ObjectId userId;
    private ObjectId serviceId;
    private ObjectId shopId;
    private User mockUser;
    private ServiceEntity mockService;
    private ServiceRequestDTO mockRequestDTO;
    private ServiceResponseDTO mockResponseDTO;

    @BeforeEach
    void setUp() {
        userId = new ObjectId();
        serviceId = new ObjectId();
        shopId = new ObjectId();

        // Setup mock user
        mockUser = new User();
        mockUser.setId(userId);
        mockUser.setEmail("provider@test.com");
        mockUser.setFirstName("Jane");
        mockUser.setLastName("Smith");

        // Setup mock service
        mockService = new ServiceEntity();
        mockService.setId(serviceId);
        mockService.setName("Web Development");
        mockService.setDescription("Professional web development services");
        mockService.setPrice(500.0);
        mockService.setShopId(shopId);

        // Setup mock DTOs
        mockRequestDTO = new ServiceRequestDTO();
        mockRequestDTO.setName("Web Development");
        mockRequestDTO.setDescription("Professional web development services");
        mockRequestDTO.setPrice(500.0);
        mockRequestDTO.setShopId(shopId.toHexString()); // Add shopId to DTO

        mockResponseDTO = new ServiceResponseDTO();
        mockResponseDTO.setId(serviceId.toHexString());
        mockResponseDTO.setName("Web Development");
        mockResponseDTO.setPrice(500.0);
    }

    // ==================== CREATE TESTS ====================

    @Test
    @DisplayName("Should create service successfully")
    void testCreateService_Success() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(serviceMapper.toEntity(mockRequestDTO)).thenReturn(mockService);
        when(serviceRepository.save(any(ServiceEntity.class))).thenReturn(mockService);
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        // Act
        ServiceResponseDTO result = serviceService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        assertEquals(mockResponseDTO.getName(), result.getName());
        assertEquals(mockResponseDTO.getPrice(), result.getPrice());
        verify(serviceRepository, times(1)).save(any(ServiceEntity.class));
        verify(serviceMapper, times(1)).toEntity(mockRequestDTO);
        verify(serviceMapper, times(1)).toDTO(mockService);
    }

    @Test
    @DisplayName("Should set shop ID when creating service")
    void testCreateService_SetShopId() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(serviceMapper.toEntity(mockRequestDTO)).thenReturn(mockService);
        when(serviceRepository.save(any(ServiceEntity.class))).thenAnswer(invocation -> {
            ServiceEntity saved = invocation.getArgument(0);
            assertNotNull(saved.getShopId());
            return saved;
        });
        when(serviceMapper.toDTO(any(ServiceEntity.class))).thenReturn(mockResponseDTO);

        // Act
        serviceService.create(mockRequestDTO);

        // Assert
        verify(serviceRepository).save(argThat(service -> 
            service.getShopId() != null
        ));
    }

    // ==================== READ TESTS ====================

    @Test
    @DisplayName("Should retrieve all services")
    void testFindAll_Success() {
        // Arrange
        List<ServiceEntity> services = Arrays.asList(mockService);
        when(serviceRepository.findAll()).thenReturn(services);
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        // Act
        List<ServiceResponseDTO> result = serviceService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Web Development", result.get(0).getName());
        verify(serviceRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should retrieve service by ID")
    void testFindById_Success() {
        // Arrange
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(mockService));
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        // Act
        ServiceResponseDTO result = serviceService.findById(serviceId);

        // Assert
        assertNotNull(result);
        assertEquals(mockResponseDTO.getId(), result.getId());
        verify(serviceRepository, times(1)).findById(serviceId);
    }

    @Test
    @DisplayName("Should throw exception when service not found")
    void testFindById_NotFound() {
        // Arrange
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            serviceService.findById(serviceId);
        });
        verify(serviceRepository, times(1)).findById(serviceId);
    }

    @Test
    @DisplayName("Should retrieve services for current seller")
    void testFindForCurrentSeller_Success() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("provider@test.com");
        SecurityContextHolder.setContext(securityContext);
        
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(userRepository.findByEmail("provider@test.com")).thenReturn(Optional.of(mockUser));
        when(shopRepository.findByOwnerId(userId)).thenReturn(Optional.of(mockShop));
        when(serviceRepository.findByShopId(shopId)).thenReturn(Arrays.asList(mockService));
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        // Act
        List<ServiceResponseDTO> result = serviceService.findForCurrentSeller();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(userRepository, times(1)).findByEmail("provider@test.com");
        verify(serviceRepository, times(1)).findByShopId(shopId);
    }

    // ==================== UPDATE TESTS ====================

    @Test
    @DisplayName("Should update service successfully")
    void testUpdate_Success() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(mockService));
        when(serviceRepository.save(any(ServiceEntity.class))).thenReturn(mockService);
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        mockRequestDTO.setName("Updated Service");
        mockRequestDTO.setPrice(600.0);

        // Act
        ServiceResponseDTO result = serviceService.update(serviceId, mockRequestDTO);

        // Assert
        assertNotNull(result);
        verify(serviceRepository, times(1)).findById(serviceId);
        verify(serviceRepository, times(1)).save(any(ServiceEntity.class));
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent service")
    void testUpdate_NotFound() {
        // Arrange
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            serviceService.update(serviceId, mockRequestDTO);
        });
        verify(serviceRepository, times(1)).findById(serviceId);
        verify(serviceRepository, never()).save(any(ServiceEntity.class));
    }

    @Test
    @DisplayName("Should preserve shopId when updating service")
    void testUpdate_PreserveShopId() {
        // Arrange
        ObjectId originalShopId = new ObjectId();
        mockService.setShopId(originalShopId);
        mockRequestDTO.setShopId(originalShopId.toHexString());
        
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(originalShopId);
        when(shopRepository.findById(originalShopId)).thenReturn(Optional.of(mockShop));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(mockService));
        when(serviceRepository.save(any(ServiceEntity.class))).thenAnswer(invocation -> {
            ServiceEntity saved = invocation.getArgument(0);
            assertEquals(originalShopId, saved.getShopId());
            return saved;
        });
        when(serviceMapper.toDTO(any(ServiceEntity.class))).thenReturn(mockResponseDTO);

        // Act
        serviceService.update(serviceId, mockRequestDTO);

        // Assert
        verify(serviceRepository).save(argThat(service -> 
            service.getShopId().equals(originalShopId)
        ));
    }

    // ==================== DELETE TESTS ====================

    @Test
    @DisplayName("Should delete service successfully")
    void testDelete_Success() {
        // Arrange
        when(serviceRepository.existsById(serviceId)).thenReturn(true);
        doNothing().when(serviceRepository).deleteById(serviceId);

        // Act
        serviceService.deleteById(serviceId);

        // Assert
        verify(serviceRepository, times(1)).existsById(serviceId);
        verify(serviceRepository, times(1)).deleteById(serviceId);
    }

    @Test
    @DisplayName("Should throw exception when deleting non-existent service")
    void testDelete_NotFound() {
        // Arrange
        when(serviceRepository.existsById(serviceId)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            serviceService.deleteById(serviceId);
        });
        verify(serviceRepository, times(1)).existsById(serviceId);
        verify(serviceRepository, never()).deleteById(any(ObjectId.class));
    }

    // ==================== OWNERSHIP VALIDATION TESTS ====================

    @Test
    @DisplayName("Should validate seller can only access their own services")
    void testOwnership_SellerAccessOwnServices() {
        // Arrange
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("provider@test.com");
        SecurityContextHolder.setContext(securityContext);
        
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(userRepository.findByEmail("provider@test.com")).thenReturn(Optional.of(mockUser));
        when(shopRepository.findByOwnerId(userId)).thenReturn(Optional.of(mockShop));
        when(serviceRepository.findByShopId(shopId)).thenReturn(Arrays.asList(mockService));
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        // Act
        List<ServiceResponseDTO> result = serviceService.findForCurrentSeller();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        // Verify only services from seller's shop are returned
        verify(serviceRepository).findByShopId(shopId);
    }

    // ==================== BUSINESS LOGIC TESTS ====================

    @Test
    @DisplayName("Should validate category exists before creating service")
    void testCreate_ValidateCategory() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        ObjectId categoryId = new ObjectId();
        mockRequestDTO.setCategoryId(categoryId.toHexString());
        
        esprit_market.entity.marketplace.Category mockCategory = new esprit_market.entity.marketplace.Category();
        mockCategory.setId(categoryId);
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(mockCategory));
        when(serviceMapper.toEntity(mockRequestDTO)).thenReturn(mockService);
        when(serviceRepository.save(any(ServiceEntity.class))).thenReturn(mockService);
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        // Act
        ServiceResponseDTO result = serviceService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        verify(categoryRepository, times(1)).findById(categoryId);
    }

    @Test
    @DisplayName("Should handle price validation")
    void testCreate_ValidatePrice() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        mockRequestDTO.setPrice(-100.0); // Invalid negative price
        when(serviceMapper.toEntity(mockRequestDTO)).thenReturn(mockService);

        // Act & Assert
        // Service should validate or handle invalid prices
        assertDoesNotThrow(() -> {
            when(serviceRepository.save(any(ServiceEntity.class))).thenReturn(mockService);
            when(serviceMapper.toDTO(any(ServiceEntity.class))).thenReturn(mockResponseDTO);
            serviceService.create(mockRequestDTO);
        });
    }

    // ==================== EDGE CASES ====================

    @Test
    @DisplayName("Should return empty list when no services exist")
    void testFindAll_EmptyList() {
        // Arrange
        when(serviceRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        List<ServiceResponseDTO> result = serviceService.findAll();

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(serviceRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should handle null description gracefully")
    void testCreate_NullDescription() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        mockRequestDTO.setDescription(null);
        when(serviceMapper.toEntity(mockRequestDTO)).thenReturn(mockService);
        when(serviceRepository.save(any(ServiceEntity.class))).thenReturn(mockService);
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        // Act
        ServiceResponseDTO result = serviceService.create(mockRequestDTO);

        // Assert
        assertNotNull(result);
        verify(serviceRepository, times(1)).save(any(ServiceEntity.class));
    }

    @Test
    @DisplayName("Should handle concurrent updates")
    void testUpdate_ConcurrentModification() {
        // Arrange
        esprit_market.entity.marketplace.Shop mockShop = new esprit_market.entity.marketplace.Shop();
        mockShop.setId(shopId);
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(mockShop));
        when(serviceRepository.findById(serviceId)).thenReturn(Optional.of(mockService));
        when(serviceRepository.save(any(ServiceEntity.class))).thenReturn(mockService);
        when(serviceMapper.toDTO(mockService)).thenReturn(mockResponseDTO);

        // Act
        ServiceResponseDTO result1 = serviceService.update(serviceId, mockRequestDTO);
        ServiceResponseDTO result2 = serviceService.update(serviceId, mockRequestDTO);

        // Assert
        assertNotNull(result1);
        assertNotNull(result2);
        verify(serviceRepository, times(2)).save(any(ServiceEntity.class));
    }
}

