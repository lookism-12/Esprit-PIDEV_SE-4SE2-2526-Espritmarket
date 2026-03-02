package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ServiceMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceServiceTest {

    @Mock
    private ServiceRepository repository;
    @Mock
    private ShopRepository shopRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private ServiceMapper mapper;

    @InjectMocks
    private ServiceService serviceService;

    private ObjectId serviceId;
    private ObjectId shopId;
    private ServiceEntity serviceEntity;
    private ServiceRequestDTO serviceRequestDTO;
    private ServiceResponseDTO serviceResponseDTO;

    @BeforeEach
    void setUp() {
        serviceId = new ObjectId();
        shopId = new ObjectId();

        serviceEntity = new ServiceEntity();
        serviceEntity.setId(serviceId);
        serviceEntity.setName("Test Service");
        serviceEntity.setShopId(shopId);

        serviceRequestDTO = new ServiceRequestDTO();
        serviceRequestDTO.setName("Test Service");
        serviceRequestDTO.setShopId(shopId.toHexString());

        serviceResponseDTO = new ServiceResponseDTO();
        serviceResponseDTO.setId(serviceId.toHexString());
        serviceResponseDTO.setName("Test Service");
    }

    @Test
    void findAll_ShouldReturnList() {
        when(repository.findAll()).thenReturn(Collections.singletonList(serviceEntity));
        when(mapper.toDTO(serviceEntity)).thenReturn(serviceResponseDTO);

        List<ServiceResponseDTO> result = serviceService.findAll();

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void create_WhenValid_ShouldReturnDTO() {
        when(shopRepository.findById(shopId)).thenReturn(Optional.of(new Shop()));
        when(mapper.toEntity(serviceRequestDTO)).thenReturn(serviceEntity);
        when(repository.save(any(ServiceEntity.class))).thenReturn(serviceEntity);
        when(mapper.toDTO(serviceEntity)).thenReturn(serviceResponseDTO);

        ServiceResponseDTO result = serviceService.create(serviceRequestDTO);

        assertNotNull(result);
        verify(shopRepository, times(1)).findById(shopId);
        verify(repository, times(1)).save(any(ServiceEntity.class));
    }

    @Test
    void deleteById_WhenExists_ShouldDelete() {
        when(repository.existsById(serviceId)).thenReturn(true);

        serviceService.deleteById(serviceId);

        verify(repository, times(1)).existsById(serviceId);
        verify(repository, times(1)).deleteById(serviceId);
    }
}
