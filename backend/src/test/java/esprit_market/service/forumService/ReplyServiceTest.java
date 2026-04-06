package esprit_market.service.forumService;

import esprit_market.dto.forum.ReplyRequest;
import esprit_market.entity.forum.Reply;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.ReplyRepository;
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
class ReplyServiceTest {

    @Mock
    private ReplyRepository repository;

    @InjectMocks
    private ReplyService replyService;

    @Test
    void findAll_ShouldReturnList() {
        Reply r1 = new Reply();
        Reply r2 = new Reply();
        when(repository.findAll()).thenReturn(Arrays.asList(r1, r2));

        List<Reply> result = replyService.findAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenIdExists_ShouldReturnReply() {
        ObjectId id = new ObjectId();
        Reply reply = new Reply();
        when(repository.findById(id)).thenReturn(Optional.of(reply));

        Reply result = replyService.findById(id);

        assertNotNull(result);
        verify(repository, times(1)).findById(id);
    }

    @Test
    void findById_WhenIdDoesNotExist_ShouldReturnNull() {
        ObjectId id = new ObjectId();
        when(repository.findById(id)).thenReturn(Optional.empty());

        Reply result = replyService.findById(id);

        assertNull(result);
    }

    @Test
    void create_WithValidDto_ShouldReturnSavedReply() {
        ReplyRequest dto = new ReplyRequest();
        Reply entity = new Reply();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toReply(dto)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);

            Reply result = replyService.create(dto);

            assertNotNull(result);
            verify(repository, times(1)).save(entity);
        }
    }

    @Test
    void create_WhenMapperReturnsNull_ShouldReturnNull() {
        ReplyRequest dto = new ReplyRequest();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toReply(dto)).thenReturn(null);

            Reply result = replyService.create(dto);

            assertNull(result);
            verify(repository, never()).save(any());
        }
    }

    @Test
    void update_WhenReplyExists_ShouldUpdateFieldsAndSave() {
        ObjectId id = new ObjectId();
        ReplyRequest dto = new ReplyRequest();
        dto.setContent("Updated Reply");
        
        Reply existing = new Reply();
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        Reply result = replyService.update(id, dto);

        assertNotNull(result);
        verify(repository, times(1)).save(existing);
    }

    @Test
    void update_WhenDtoIsNull_ShouldReturnExistingWithoutModifying() {
        ObjectId id = new ObjectId();
        Reply existing = new Reply();
        when(repository.findById(id)).thenReturn(Optional.of(existing));

        Reply result = replyService.update(id, null);

        assertNotNull(result);
        verify(repository, never()).save(any());
    }

    @Test
    void deleteById_ShouldCallRepositoryDelete() {
        ObjectId id = new ObjectId();
        replyService.deleteById(id);
        verify(repository, times(1)).deleteById(id);
    }
}
