package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.CategoryRequestDTO;
import esprit_market.dto.marketplace.CategoryResponseDTO;
import esprit_market.entity.marketplace.Category;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.mappers.marketplace.CategoryMapper;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
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
class CategoryServiceTest {

    @Mock
    private CategoryRepository repository;

    @Mock
    private CategoryMapper mapper;

    @InjectMocks
    private CategoryService categoryService;

    private ObjectId categoryId;
    private Category category;
    private CategoryRequestDTO categoryRequestDTO;
    private CategoryResponseDTO categoryResponseDTO;

    @BeforeEach
    void setUp() {
        categoryId = new ObjectId();

        category = new Category();
        category.setId(categoryId);
        category.setName("Electronics");

        categoryRequestDTO = new CategoryRequestDTO();
        categoryRequestDTO.setName("Electronics");

        categoryResponseDTO = new CategoryResponseDTO();
        categoryResponseDTO.setId(categoryId.toHexString());
        categoryResponseDTO.setName("Electronics");
    }

    @Test
    void findAll_ShouldReturnList() {
        when(repository.findAll()).thenReturn(Collections.singletonList(category));
        when(mapper.toDTO(category)).thenReturn(categoryResponseDTO);

        List<CategoryResponseDTO> result = categoryService.findAll();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Electronics", result.get(0).getName());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenExists_ShouldReturnDTO() {
        when(repository.findById(categoryId)).thenReturn(Optional.of(category));
        when(mapper.toDTO(category)).thenReturn(categoryResponseDTO);

        CategoryResponseDTO result = categoryService.findById(categoryId);

        assertNotNull(result);
        assertEquals(categoryId.toHexString(), result.getId());
        verify(repository, times(1)).findById(categoryId);
    }

    @Test
    void findById_WhenNotExists_ShouldThrowException() {
        when(repository.findById(categoryId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> categoryService.findById(categoryId));
    }

    @Test
    void create_ShouldReturnDTO() {
        when(mapper.toEntity(categoryRequestDTO)).thenReturn(category);
        when(repository.save(any(Category.class))).thenReturn(category);
        when(mapper.toDTO(category)).thenReturn(categoryResponseDTO);

        CategoryResponseDTO result = categoryService.create(categoryRequestDTO);

        assertNotNull(result);
        assertEquals("Electronics", result.getName());
        verify(repository, times(1)).save(any(Category.class));
    }

    @Test
    void update_WhenExists_ShouldReturnDTO() {
        when(repository.findById(categoryId)).thenReturn(Optional.of(category));
        when(repository.save(any(Category.class))).thenReturn(category);
        when(mapper.toDTO(category)).thenReturn(categoryResponseDTO);

        CategoryResponseDTO result = categoryService.update(categoryId, categoryRequestDTO);

        assertNotNull(result);
        verify(repository, times(1)).findById(categoryId);
        verify(repository, times(1)).save(any(Category.class));
    }

    @Test
    void deleteById_WhenExists_ShouldDelete() {
        when(repository.existsById(categoryId)).thenReturn(true);

        categoryService.deleteById(categoryId);

        verify(repository, times(1)).existsById(categoryId);
        verify(repository, times(1)).deleteById(categoryId);
    }

    @Test
    void deleteById_WhenNotExists_ShouldThrowException() {
        when(repository.existsById(categoryId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> categoryService.deleteById(categoryId));
    }
}
