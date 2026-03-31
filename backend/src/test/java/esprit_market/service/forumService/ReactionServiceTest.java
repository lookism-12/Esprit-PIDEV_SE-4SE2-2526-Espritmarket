package esprit_market.service.forumService;

import esprit_market.dto.forum.ReactionRequest;
import esprit_market.entity.forum.Reaction;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.ReactionRepository;
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
class ReactionServiceTest {

    @Mock
    private ReactionRepository repository;

    @InjectMocks
    private ReactionService reactionService;

    @Test
    void findAll_ShouldReturnList() {
        Reaction r1 = new Reaction();
        Reaction r2 = new Reaction();
        when(repository.findAll()).thenReturn(Arrays.asList(r1, r2));

        List<Reaction> result = reactionService.findAll();

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(repository, times(1)).findAll();
    }

    @Test
    void findById_WhenIdExists_ShouldReturnReaction() {
        ObjectId id = new ObjectId();
        Reaction reaction = new Reaction();
        when(repository.findById(id)).thenReturn(Optional.of(reaction));

        Reaction result = reactionService.findById(id);

        assertNotNull(result);
        verify(repository, times(1)).findById(id);
    }

    @Test
    void findById_WhenIdDoesNotExist_ShouldReturnNull() {
        ObjectId id = new ObjectId();
        when(repository.findById(id)).thenReturn(Optional.empty());

        Reaction result = reactionService.findById(id);

        assertNull(result);
    }

    @Test
    void create_WithValidDto_ShouldReturnSavedReaction() {
        ReactionRequest dto = new ReactionRequest();
        Reaction entity = new Reaction();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toReaction(dto)).thenReturn(entity);
            when(repository.save(entity)).thenReturn(entity);

            Reaction result = reactionService.create(dto);

            assertNotNull(result);
            verify(repository, times(1)).save(entity);
        }
    }

    @Test
    void create_WhenMapperReturnsNull_ShouldReturnNull() {
        ReactionRequest dto = new ReactionRequest();
        
        try (MockedStatic<ForumMapper> mockedMapper = mockStatic(ForumMapper.class)) {
            mockedMapper.when(() -> ForumMapper.toReaction(dto)).thenReturn(null);

            Reaction result = reactionService.create(dto);

            assertNull(result);
            verify(repository, never()).save(any());
        }
    }

    @Test
    void deleteById_ShouldCallRepositoryDelete() {
        ObjectId id = new ObjectId();
        reactionService.deleteById(id);
        verify(repository, times(1)).deleteById(id);
    }
}
