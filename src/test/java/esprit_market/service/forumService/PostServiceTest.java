package esprit_market.service.forumService;

import esprit_market.dto.forum.PostRequest;
import esprit_market.dto.forum.PostResponse;
import esprit_market.entity.forum.Post;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.PostRepository;
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
@DisplayName("Post Service Tests")
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private PostService postService;

    private PostRequest postRequest;
    private Post post;
    private String postId;
    private String userId;
    private String categoryId;

    @BeforeEach
    void setUp() {
        postId = new ObjectId().toHexString();
        userId = new ObjectId().toHexString();
        categoryId = new ObjectId().toHexString();

        postRequest = PostRequest.builder()
                .userId(userId)
                .categoryId(categoryId)
                .content("Test post content")
                .build();

        post = Post.builder()
                .id(new ObjectId(postId))
                .userId(new ObjectId(userId))
                .categoryId(new ObjectId(categoryId))
                .content("Test post content")
                .createdAt(LocalDateTime.now())
                .isPinned(false)
                .isApproved(false)
                .commentIds(new ArrayList<>())
                .reactionIds(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("Should create a post successfully")
    void testCreatePost() {
        // Arrange
        when(postRepository.save(any(Post.class))).thenReturn(post);

        // Act
        Post result = postService.create(postRequest);

        // Assert
        assertNotNull(result);
        assertEquals(post.getContent(), result.getContent());
        verify(postRepository, times(1)).save(any(Post.class));
    }

    @Test
    @DisplayName("Should retrieve post by ID")
    void testGetPostById() {
        // Arrange
        when(postRepository.findById(new ObjectId(postId))).thenReturn(Optional.of(post));

        // Act
        Post result = postService.findById(new ObjectId(postId));

        // Assert
        assertNotNull(result);
        assertEquals(postId, result.getId().toHexString());
        verify(postRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should return null when post not found")
    void testGetPostByIdNotFound() {
        // Arrange
        when(postRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

        // Act
        Post result = postService.findById(new ObjectId());

        // Assert
        assertNull(result);
        verify(postRepository, times(1)).findById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should update post successfully")
    void testUpdatePost() {
        // Arrange
        PostRequest updateRequest = PostRequest.builder()
                .userId(userId)
                .categoryId(categoryId)
                .content("Updated content")
                .build();

        Post updatedPost = Post.builder()
                .id(post.getId())
                .userId(post.getUserId())
                .categoryId(post.getCategoryId())
                .content("Updated content")
                .createdAt(post.getCreatedAt())
                .isPinned(post.isPinned())
                .isApproved(post.isApproved())
                .commentIds(post.getCommentIds())
                .reactionIds(post.getReactionIds())
                .build();

        when(postRepository.findById(new ObjectId(postId))).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenReturn(updatedPost);

        // Act
        Post result = postService.update(new ObjectId(postId), updateRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Updated content", result.getContent());
        verify(postRepository, times(1)).findById(any(ObjectId.class));
        verify(postRepository, times(1)).save(any(Post.class));
    }

    @Test
    @DisplayName("Should delete post successfully")
    void testDeletePost() {
        // Arrange
        doNothing().when(postRepository).deleteById(any(ObjectId.class));

        // Act
        postService.deleteById(new ObjectId(postId));

        // Assert
        verify(postRepository, times(1)).deleteById(any(ObjectId.class));
    }

    @Test
    @DisplayName("Should retrieve all posts")
    void testGetAllPosts() {
        // Arrange
        List<Post> posts = List.of(post);
        when(postRepository.findAll()).thenReturn(posts);

        // Act
        List<Post> result = postService.findAll();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        verify(postRepository, times(1)).findAll();
    }
}
