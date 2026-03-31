package esprit_market.service.forumService;

import esprit_market.dto.forum.CategoryForumRequest;
import esprit_market.entity.forum.CategoryForum;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.CategoryForumRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryForumServiceTest {

    @Mock
    private CategoryForumRepository repository;

    @InjectMocks
    private CategoryForumService categoryForumService;

    @Test
    void findAll_ShouldReturnList() {
        CategoryForum cat1 = new CategoryForum();
        CategoryForum cat2 = new CategoryForum();
        when(repository.findAll()).thenReturn(Arrays.asList(cat1, cat2));

        List<CategoryForum> result = categoryForumService.findAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenIdExists_ShouldReturnCategoryForum() {
        ObjectId id = new ObjectId();
        CategoryForum cat = new CategoryForum();
        when(repository.findById(id)).thenReturn(Optional.of(cat));

        CategoryForum result = categoryForumService.findById(id);

        assertNotNull(result);
        verify(repository, times(1)).findById(id);
    }

    @Test
    void findById_WhenIdDoesNotExist_ShouldReturnNull() {
        ObjectId id = new ObjectId();
        when(repository.findById(id)).thenReturn(Optional.empty());

        CategoryForum result = categoryForumService.findById(id);

        assertNull(result);
    }

    @Test
    void create_WithValidDto_ShouldReturnSavedCategory() {
        CategoryForumRequest dto = new CategoryForumRequest();
        CategoryForum entity = new CategoryForum();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toCategoryForum(dto)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);

            CategoryForum result = categoryForumService.create(dto);

            assertNotNull(result);
            verify(repository, times(1)).save(entity);
        }
    }

    @Test
    void create_WhenMapperReturnsNull_ShouldReturnNull() {
        CategoryForumRequest dto = new CategoryForumRequest();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toCategoryForum(dto)).thenReturn(null);

            CategoryForum result = categoryForumService.create(dto);

            assertNull(result);
            verify(repository, never()).save(any());
        }
    }

    @Test
    void update_WhenCategoryExists_ShouldUpdateFieldsAndSave() {
        ObjectId id = new ObjectId();
        CategoryForumRequest dto = new CategoryForumRequest();
        // Assuming dto has getters returning some values
        CategoryForum existing = new CategoryForum();
        
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        CategoryForum result = categoryForumService.update(id, dto);

        assertNotNull(result);
        verify(repository, times(1)).save(existing);
    }

    @Test
    void update_WhenDtoIsNull_ShouldReturnExistingCategoryWithoutModifying() {
        ObjectId id = new ObjectId();
        CategoryForum existing = new CategoryForum();
        when(repository.findById(id)).thenReturn(Optional.of(existing));

        CategoryForum result = categoryForumService.update(id, null);

        assertNotNull(result);
        verify(repository, never()).save(any());
    }

    @Test
    void deleteById_ShouldCallRepositoryDelete() {
        ObjectId id = new ObjectId();
        categoryForumService.deleteById(id);
        verify(repository, times(1)).deleteById(id);
    }
}
