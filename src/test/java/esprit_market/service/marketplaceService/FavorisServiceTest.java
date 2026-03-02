package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.FavorisRequestDTO;
import esprit_market.dto.marketplace.FavorisResponseDTO;
import esprit_market.entity.marketplace.Favoris;
import esprit_market.entity.user.User;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.mappers.marketplace.FavorisMapper;
import esprit_market.repository.marketplaceRepository.FavorisRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.userRepository.UserRepository;
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
class FavorisServiceTest {

    @Mock
    private FavorisRepository repository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private ServiceRepository serviceRepository;
    @Mock
    private FavorisMapper mapper;

    @InjectMocks
    private FavorisService favorisService;

    private ObjectId favorisId;
    private ObjectId userId;
    private ObjectId productId;
    private Favoris favoris;
    private User user;
    private FavorisRequestDTO favorisRequestDTO;
    private FavorisResponseDTO favorisResponseDTO;

    @BeforeEach
    void setUp() {
        favorisId = new ObjectId();
        userId = new ObjectId();
        productId = new ObjectId();

        favoris = new Favoris();
        favoris.setId(favorisId);
        favoris.setUserId(userId);
        favoris.setProductId(productId);

        user = new User();
        user.setId(userId);
        user.setFavorisIds(new ArrayList<>());

        favorisRequestDTO = new FavorisRequestDTO();
        favorisRequestDTO.setUserId(userId.toHexString());
        favorisRequestDTO.setProductId(productId.toHexString());

        favorisResponseDTO = new FavorisResponseDTO();
        favorisResponseDTO.setId(favorisId.toHexString());
    }

    @Test
    void findAll_ShouldReturnList() {
        when(repository.findAll()).thenReturn(Collections.singletonList(favoris));
        when(mapper.toDTO(favoris)).thenReturn(favorisResponseDTO);

        List<FavorisResponseDTO> result = favorisService.findAll();

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void create_WhenValidProduct_ShouldReturnDTO() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(productRepository.findById(productId)).thenReturn(Optional.of(any()));
        when(mapper.toEntity(favorisRequestDTO)).thenReturn(favoris);
        when(repository.save(any(Favoris.class))).thenReturn(favoris);
        when(mapper.toDTO(favoris)).thenReturn(favorisResponseDTO);

        FavorisResponseDTO result = favorisService.create(favorisRequestDTO);

        assertNotNull(result);
        verify(userRepository, times(1)).findById(userId);
        verify(productRepository, times(1)).findById(productId);
        verify(repository, times(1)).save(any(Favoris.class));
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void delete_WhenExists_ShouldDelete() {
        when(repository.findById(favorisId)).thenReturn(Optional.of(favoris));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        favorisService.delete(favorisId);

        verify(repository, times(1)).deleteById(favorisId);
        verify(userRepository, times(1)).save(user);
    }
}
