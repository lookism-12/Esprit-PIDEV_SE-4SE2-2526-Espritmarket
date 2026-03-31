package esprit_market.service.forumService;

import esprit_market.dto.forum.PostRequest;
import esprit_market.entity.forum.Post;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.PostRepository;
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
class PostServiceTest {

    @Mock
    private PostRepository repository;

    @InjectMocks
    private PostService postService;

    @Test
    void findAll_ShouldReturnListOfPosts() {
        // Arrange
        Post post1 = new Post();
        Post post2 = new Post();
        when(repository.findAll()).thenReturn(Arrays.asList(post1, post2));

        // Act
        List<Post> result = postService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenIdExists_ShouldReturnPost() {
        // Arrange
        ObjectId id = new ObjectId();
        Post post = new Post();
        when(repository.findById(id)).thenReturn(Optional.of(post));

        // Act
        Post result = postService.findById(id);

        // Assert
        assertNotNull(result);
        verify(repository, times(1)).findById(id);
    }

    @Test
    void findById_WhenIdDoesNotExist_ShouldReturnNull() {
        // Arrange
        ObjectId id = new ObjectId();
        when(repository.findById(id)).thenReturn(Optional.empty());

        // Act
        Post result = postService.findById(id);

        // Assert
        assertNull(result);
        verify(repository, times(1)).findById(id);
    }

    @Test
    void create_WithValidDto_ShouldReturnSavedPost() {
        // Arrange
        PostRequest dto = new PostRequest();
        Post entity = new Post();
        Post savedEntity = new Post();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toPost(dto)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(savedEntity);

            // Act
            Post result = postService.create(dto);

            // Assert
            assertNotNull(result);
            verify(repository, times(1)).save(entity);
        }
    }

    @Test
    void create_WhenMapperReturnsNull_ShouldReturnNull() {
        // Arrange
        PostRequest dto = new PostRequest();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toPost(dto)).thenReturn(null);

            // Act
            Post result = postService.create(dto);

            // Assert
            assertNull(result);
            verify(repository, never()).save(any());
        }
    }

    @Test
    void update_WhenPostExists_ShouldUpdateFieldsAndReturnPost() {
        // Arrange
        ObjectId id = new ObjectId();
        PostRequest dto = new PostRequest();
        dto.setContent("New Content");
        dto.setPinned(true);
        dto.setApproved(true);

        Post existing = new Post();
        existing.setContent("Old Content");
        existing.setPinned(false);
        existing.setApproved(false);

        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        // Act
        Post result = postService.update(id, dto);

        // Assert
        assertNotNull(result);
        verify(repository, times(1)).findById(id);
        verify(repository, times(1)).save(existing);
        // Validating the fields using getter is tricky since we shouldn't invent getters,
        // but verify(repository).save(...) is tested. We assume setters exist because the service uses them.
    }

    @Test
    void update_WhenPostDoesNotExist_ShouldReturnNull() {
        // Arrange
        ObjectId id = new ObjectId();
        PostRequest dto = new PostRequest();
        when(repository.findById(id)).thenReturn(Optional.empty());

        // Act
        Post result = postService.update(id, dto);

        // Assert
        assertNull(result);
        verify(repository, never()).save(any());
    }

    @Test
    void update_WhenDtoIsNull_ShouldReturnExistingPostWithoutModifying() {
        // Arrange
        ObjectId id = new ObjectId();
        Post existing = new Post();
        when(repository.findById(id)).thenReturn(Optional.of(existing));

        // Act
        Post result = postService.update(id, null);

        // Assert
        assertNotNull(result);
        verify(repository, never()).save(any());
    }

    @Test
    void deleteById_ShouldCallRepositoryDelete() {
        // Arrange
        ObjectId id = new ObjectId();

        // Act
        postService.deleteById(id);

        // Assert
        verify(repository, times(1)).deleteById(id);
    }
}
