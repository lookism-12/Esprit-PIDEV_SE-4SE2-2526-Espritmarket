package esprit_market.service.forumService;

import esprit_market.dto.forum.MessageRequest;
import esprit_market.entity.forum.Message;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.MessageRepository;
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
class MessageServiceTest {

    @Mock
    private MessageRepository repository;

    @InjectMocks
    private MessageService messageService;

    @Test
    void findAll_ShouldReturnList() {
        Message m1 = new Message();
        Message m2 = new Message();
        when(repository.findAll()).thenReturn(Arrays.asList(m1, m2));

        List<Message> result = messageService.findAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenIdExists_ShouldReturnMessage() {
        ObjectId id = new ObjectId();
        Message msg = new Message();
        when(repository.findById(id)).thenReturn(Optional.of(msg));

        Message result = messageService.findById(id);

        assertNotNull(result);
        verify(repository, times(1)).findById(id);
    }

    @Test
    void findById_WhenIdDoesNotExist_ShouldReturnNull() {
        ObjectId id = new ObjectId();
        when(repository.findById(id)).thenReturn(Optional.empty());

        Message result = messageService.findById(id);

        assertNull(result);
    }

    @Test
    void create_WithValidDto_ShouldReturnSavedMessage() {
        MessageRequest dto = new MessageRequest();
        Message entity = new Message();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toMessage(dto)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);

            Message result = messageService.create(dto);

            assertNotNull(result);
            verify(repository, times(1)).save(entity);
        }
    }

    @Test
    void create_WhenMapperReturnsNull_ShouldReturnNull() {
        MessageRequest dto = new MessageRequest();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toMessage(dto)).thenReturn(null);

            Message result = messageService.create(dto);

            assertNull(result);
            verify(repository, never()).save(any());
        }
    }

    @Test
    void update_WhenMessageExists_ShouldUpdateFieldsAndSave() {
        ObjectId id = new ObjectId();
        MessageRequest dto = new MessageRequest();
        dto.setContent("Updated Topic Content");
        
        Message existing = new Message();
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(existing)).thenReturn(existing);

        Message result = messageService.update(id, dto);

        assertNotNull(result);
        verify(repository, times(1)).save(existing);
    }

    @Test
    void update_WhenDtoIsNull_ShouldReturnExistingWithoutModifying() {
        ObjectId id = new ObjectId();
        Message existing = new Message();
        when(repository.findById(id)).thenReturn(Optional.of(existing));

        Message result = messageService.update(id, null);

        assertNotNull(result);
        verify(repository, never()).save(any());
    }

    @Test
    void deleteById_ShouldCallRepositoryDelete() {
        ObjectId id = new ObjectId();
        messageService.deleteById(id);
        verify(repository, times(1)).deleteById(id);
    }
}
