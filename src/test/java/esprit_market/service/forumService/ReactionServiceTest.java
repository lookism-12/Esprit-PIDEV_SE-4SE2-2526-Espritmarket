package esprit_market.service.forumService;

import esprit_market.dto.forum.ReactionRequest;
import esprit_market.entity.forum.Reaction;
import esprit_market.entity.forum.ReactionType;
import esprit_market.repository.forumRepository.ReactionRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Reaction Service Tests")
class ReactionServiceTest {

    @Mock
    private ReactionRepository reactionRepository;

    @InjectMocks
    private ReactionService reactionService;

    private ReactionRequest reactionRequest;
    private Reaction reaction;
    private String reactionId;
    private String userId;
    private String postId;
    private String commentId;

    @BeforeEach
    void setUp() {
        reactionId = new ObjectId().toHexString();
        userId = new ObjectId().toHexString();
        postId = new ObjectId().toHexString();
        commentId = new ObjectId().toHexString();

        reactionRequest = ReactionRequest.builder()
                .type("LIKE")
                .userId(userId)
                .postId(postId)
                .build();

        reaction = Reaction.builder()
                .id(new ObjectId(reactionId))
                .type(ReactionType.LIKE)
                .userId(new ObjectId(userId))
                .postId(new ObjectId(postId))
                .commentId(null)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create a reaction successfully")
    void testCreateReaction() {
        // Arrange
        when(reactionRepository.save(any(Reaction.class))).thenReturn(reaction);

        // Act
        Reaction result = reactionService.create(reactionRequest);

        // Assert
        assertNotNull(result);
        assertEquals(ReactionType.LIKE, result.getType());
        verify(reactionRepository, times(1)).save(any(Reaction.class));
    }

    @Test
    @DisplayName("Should retrieve reaction by ID")
    void testGetReactionById() {
        // Arrange
        when(reactionRepository.findById(new ObjectId(reactionId))).thenReturn(Optional.of(reaction));

        // Act
        Reaction result = reactionService.findById(new ObjectId(reactionId));

        // Assert
        assertNotNull(result);
        assertEquals(reactionId, result.getId().toHexString());
        verify(reactionRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should return null when reaction not found")
    void testGetReactionByIdNotFound() {
        // Arrange
        when(reactionRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

        // Act
        Reaction result = reactionService.findById(new ObjectId());

        // Assert
        assertNull(result);
        verify(reactionRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should delete reaction successfully")
    void testDeleteReaction() {
        // Arrange
        doNothing().when(reactionRepository).deleteById(any(ObjectId.class));

        // Act
        reactionService.deleteById(new ObjectId(reactionId));

        // Assert
        verify(reactionRepository, times(1)).deleteById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should retrieve all reactions")
    void testGetAllReactions() {
        // Arrange
        List<Reaction> reactions = List.of(reaction);
        when(reactionRepository.findAll()).thenReturn(reactions);

        // Act
        List<Reaction> result = reactionService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(reactionRepository, times(1)).findAll();
    }
}
