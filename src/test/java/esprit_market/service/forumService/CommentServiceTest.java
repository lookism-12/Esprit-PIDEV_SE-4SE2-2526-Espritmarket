package esprit_market.service.forumService;

import esprit_market.dto.forum.CommentRequest;
import esprit_market.entity.forum.Comment;
import esprit_market.repository.forumRepository.CommentRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Comment Service Tests")
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @InjectMocks
    private CommentService commentService;

    private CommentRequest commentRequest;
    private Comment comment;
    private String commentId;
    private String postId;
    private String userId;

    @BeforeEach
    void setUp() {
        commentId = new ObjectId().toHexString();
        postId = new ObjectId().toHexString();
        userId = new ObjectId().toHexString();

        commentRequest = CommentRequest.builder()
                .postId(postId)
                .userId(userId)
                .content("Test comment content")
                .build();

        comment = Comment.builder()
                .id(new ObjectId(commentId))
                .postId(new ObjectId(postId))
                .userId(new ObjectId(userId))
                .content("Test comment content")
                .createdAt(LocalDateTime.now())
                .reactionIds(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Should create a comment successfully")
    void testCreateComment() {
        // Arrange
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);

        // Act
        Comment result = commentService.create(commentRequest);

        // Assert
        assertNotNull(result);
        assertEquals(comment.getContent(), result.getContent());
        verify(commentRepository, times(1)).save(any(Comment.class));
    }

    @Test
    @DisplayName("Should retrieve comment by ID")
    void testGetCommentById() {
        // Arrange
        when(commentRepository.findById(new ObjectId(commentId))).thenReturn(Optional.of(comment));

        // Act
        Comment result = commentService.findById(new ObjectId(commentId));

        // Assert
        assertNotNull(result);
        assertEquals(commentId, result.getId().toHexString());
        verify(commentRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should return null when comment not found")
    void testGetCommentByIdNotFound() {
        // Arrange
        when(commentRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

        // Act
        Comment result = commentService.findById(new ObjectId());

        // Assert
        assertNull(result);
        verify(commentRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should update comment successfully")
    void testUpdateComment() {
        // Arrange
        CommentRequest updateRequest = CommentRequest.builder()
                .postId(postId)
                .userId(userId)
                .content("Updated comment")
                .build();

        Comment updatedComment = Comment.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .parentCommentId(comment.getParentCommentId())
                .content("Updated comment")
                .createdAt(comment.getCreatedAt())
                .reactionIds(comment.getReactionIds())
                .build();

        when(commentRepository.findById(new ObjectId(commentId))).thenReturn(Optional.of(comment));
        when(commentRepository.save(any(Comment.class))).thenReturn(updatedComment);

        // Act
        Comment result = commentService.update(new ObjectId(commentId), updateRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Updated comment", result.getContent());
        verify(commentRepository, times(1)).findById(any(ObjectId.class));
        verify(commentRepository, times(1)).save(any(Comment.class));
    }

    @Test
    @DisplayName("Should delete comment successfully")
    void testDeleteComment() {
        // Arrange
        doNothing().when(commentRepository).deleteById(any(ObjectId.class));

        // Act
        commentService.deleteById(new ObjectId(commentId));

        // Assert
        verify(commentRepository, times(1)).deleteById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should retrieve all comments")
    void testGetAllComments() {
        // Arrange
        List<Comment> comments = List.of(comment);
        when(commentRepository.findAll()).thenReturn(comments);

        // Act
        List<Comment> result = commentService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(commentRepository, times(1)).findAll();
    }
}
