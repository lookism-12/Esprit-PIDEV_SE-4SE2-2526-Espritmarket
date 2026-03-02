package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ShopMapper;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
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
class ShopServiceTest {

    @Mock
    private ShopRepository repository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ShopMapper mapper;

    @InjectMocks
    private ShopService shopService;

    private ObjectId shopId;
    private ObjectId ownerId;
    private Shop shop;
    private ShopRequestDTO shopRequestDTO;
    private ShopResponseDTO shopResponseDTO;

    @BeforeEach
    void setUp() {
        shopId = new ObjectId();
        ownerId = new ObjectId();

        shop = new Shop();
        shop.setId(shopId);
        shop.setName("Test Shop");
        shop.setOwnerId(ownerId);

        shopRequestDTO = new ShopRequestDTO();
        shopRequestDTO.setName("Test Shop");
        shopRequestDTO.setOwnerId(ownerId.toHexString());

        shopResponseDTO = new ShopResponseDTO();
        shopResponseDTO.setId(shopId.toHexString());
        shopResponseDTO.setName("Test Shop");
        shopResponseDTO.setOwnerId(ownerId.toHexString());
    }

    @Test
    void findAll_ShouldReturnList() {
        when(repository.findAll()).thenReturn(Collections.singletonList(shop));
        when(mapper.toDTO(shop)).thenReturn(shopResponseDTO);

        List<ShopResponseDTO> result = shopService.findAll();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(shopResponseDTO.getName(), result.get(0).getName());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenExists_ShouldReturnDTO() {
        when(repository.findById(shopId)).thenReturn(Optional.of(shop));
        when(mapper.toDTO(shop)).thenReturn(shopResponseDTO);

        ShopResponseDTO result = shopService.findById(shopId);

        assertNotNull(result);
        assertEquals(shopResponseDTO.getId(), result.getId());
        verify(repository, times(1)).findById(shopId);
    }

    @Test
    void findById_WhenNotExists_ShouldThrowException() {
        when(repository.findById(shopId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> shopService.findById(shopId));
        verify(repository, times(1)).findById(shopId);
    }

    @Test
    void create_WhenOwnerExists_ShouldReturnDTO() {
        when(userRepository.findById(ownerId)).thenReturn(Optional.of(new User()));
        when(mapper.toEntity(shopRequestDTO)).thenReturn(shop);
        when(repository.save(any(Shop.class))).thenReturn(shop);
        when(mapper.toDTO(shop)).thenReturn(shopResponseDTO);

        ShopResponseDTO result = shopService.create(shopRequestDTO);

        assertNotNull(result);
        assertEquals(shopResponseDTO.getName(), result.getName());
        verify(userRepository, times(1)).findById(ownerId);
        verify(repository, times(1)).save(any(Shop.class));
    }

    @Test
    void create_WhenOwnerNotFound_ShouldThrowException() {
        when(userRepository.findById(ownerId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> shopService.create(shopRequestDTO));
        verify(userRepository, times(1)).findById(ownerId);
        verify(repository, never()).save(any());
    }

    @Test
    void deleteById_WhenExists_ShouldDelete() {
        when(repository.existsById(shopId)).thenReturn(true);

        shopService.deleteById(shopId);

        verify(repository, times(1)).existsById(shopId);
        verify(repository, times(1)).deleteById(shopId);
    }

    @Test
    void deleteById_WhenNotExists_ShouldThrowException() {
        when(repository.existsById(shopId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> shopService.deleteById(shopId));
        verify(repository, times(1)).existsById(shopId);
        verify(repository, never()).deleteById(any());
    }
}
