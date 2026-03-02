package esprit_market.service.forumService;

import esprit_market.dto.forum.ReplyRequest;
import esprit_market.entity.forum.Reply;
import esprit_market.repository.forumRepository.ReplyRepository;
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
@DisplayName("Reply Service Tests")
class ReplyServiceTest {

    @Mock
    private ReplyRepository replyRepository;

    @InjectMocks
    private ReplyService replyService;

    private ReplyRequest replyRequest;
    private Reply reply;
    private String replyId;
    private String commentId;
    private String userId;

    @BeforeEach
    void setUp() {
        replyId = new ObjectId().toHexString();
        commentId = new ObjectId().toHexString();
        userId = new ObjectId().toHexString();

        replyRequest = ReplyRequest.builder()
                .commentId(commentId)
                .userId(userId)
                .content("Test reply content")
                .build();

        reply = Reply.builder()
                .id(new ObjectId(replyId))
                .commentId(new ObjectId(commentId))
                .userId(new ObjectId(userId))
                .content("Test reply content")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create a reply successfully")
    void testCreateReply() {
        // Arrange
        when(replyRepository.save(any(Reply.class))).thenReturn(reply);

        // Act
        Reply result = replyService.create(replyRequest);

        // Assert
        assertNotNull(result);
        assertEquals(reply.getContent(), result.getContent());
        verify(replyRepository, times(1)).save(any(Reply.class));
    }

    @Test
    @DisplayName("Should retrieve reply by ID")
    void testGetReplyById() {
        // Arrange
        when(replyRepository.findById(new ObjectId(replyId))).thenReturn(Optional.of(reply));

        // Act
        Reply result = replyService.findById(new ObjectId(replyId));

        // Assert
        assertNotNull(result);
        assertEquals(replyId, result.getId().toHexString());
        verify(replyRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should return null when reply not found")
    void testGetReplyByIdNotFound() {
        // Arrange
        when(replyRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

        // Act
        Reply result = replyService.findById(new ObjectId());

        // Assert
        assertNull(result);
        verify(replyRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should update reply successfully")
    void testUpdateReply() {
        // Arrange
        ReplyRequest updateRequest = ReplyRequest.builder()
                .commentId(commentId)
                .userId(userId)
                .content("Updated reply")
                .build();

        Reply updatedReply = Reply.builder()
                .id(reply.getId())
                .commentId(reply.getCommentId())
                .userId(reply.getUserId())
                .content("Updated reply")
                .createdAt(reply.getCreatedAt())
                .build();

        when(replyRepository.findById(new ObjectId(replyId))).thenReturn(Optional.of(reply));
        when(replyRepository.save(any(Reply.class))).thenReturn(updatedReply);

        // Act
        Reply result = replyService.update(new ObjectId(replyId), updateRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Updated reply", result.getContent());
        verify(replyRepository, times(1)).findById(any(ObjectId.class));
        verify(replyRepository, times(1)).save(any(Reply.class));
    }

    @Test
    @DisplayName("Should delete reply successfully")
    void testDeleteReply() {
        // Arrange
        doNothing().when(replyRepository).deleteById(any(ObjectId.class));

        // Act
        replyService.deleteById(new ObjectId(replyId));

        // Assert
        verify(replyRepository, times(1)).deleteById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should retrieve all replies")
    void testGetAllReplies() {
        // Arrange
        List<Reply> replies = List.of(reply);
        when(replyRepository.findAll()).thenReturn(replies);

        // Act
        List<Reply> result = replyService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(replyRepository, times(1)).findAll();
    }
}
