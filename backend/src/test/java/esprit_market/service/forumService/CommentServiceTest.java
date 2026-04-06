package esprit_market.service.forumService;

import esprit_market.dto.forum.CommentRequest;
import esprit_market.entity.forum.Comment;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.CommentRepository;
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
class CommentServiceTest {

    @Mock
    private CommentRepository repository;

    @InjectMocks
    private CommentService commentService;

    @Test
    void findAll_ShouldReturnList() {
        Comment c1 = new Comment();
        Comment c2 = new Comment();
        when(repository.findAll()).thenReturn(Arrays.asList(c1, c2));

        List<Comment> result = commentService.findAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenIdExists_ShouldReturnComment() {
        ObjectId id = new ObjectId();
        Comment comment = new Comment();
        when(repository.findById(id)).thenReturn(Optional.of(comment));

        Comment result = commentService.findById(id);

        assertNotNull(result);
        verify(repository, times(1)).findById(id);
    }

    @Test
    void findById_WhenIdDoesNotExist_ShouldReturnNull() {
        ObjectId id = new ObjectId();
        when(repository.findById(id)).thenReturn(Optional.empty());

        Comment result = commentService.findById(id);

        assertNull(result);
    }

    @Test
    void create_WithValidDto_ShouldReturnSavedComment() {
        CommentRequest dto = new CommentRequest();
        Comment entity = new Comment();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toComment(dto)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);

            Comment result = commentService.create(dto);

            assertNotNull(result);
            verify(repository, times(1)).save(entity);
        }
    }

    @Test
    void create_WhenMapperReturnsNull_ShouldReturnNull() {
        CommentRequest dto = new CommentRequest();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toComment(dto)).thenReturn(null);

            Comment result = commentService.create(dto);

            assertNull(result);
            verify(repository, never()).save(any());
        }
    }

    @Test
    void update_WhenCommentExists_ShouldUpdateFieldsAndSave() {
        ObjectId id = new ObjectId();
        CommentRequest dto = new CommentRequest();
        dto.setContent("Updated Content");
        
        Comment existing = new Comment();
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        Comment result = commentService.update(id, dto);

        assertNotNull(result);
        verify(repository, times(1)).save(existing);
    }

    @Test
    void update_WhenDtoIsNull_ShouldReturnExistingWithoutModifying() {
        ObjectId id = new ObjectId();
        Comment existing = new Comment();
        when(repository.findById(id)).thenReturn(Optional.of(existing));

        Comment result = commentService.update(id, null);

        assertNotNull(result);
        verify(repository, never()).save(any());
    }

    @Test
    void deleteById_ShouldCallRepositoryDelete() {
        ObjectId id = new ObjectId();
        commentService.deleteById(id);
        verify(repository, times(1)).deleteById(id);
    }
}
