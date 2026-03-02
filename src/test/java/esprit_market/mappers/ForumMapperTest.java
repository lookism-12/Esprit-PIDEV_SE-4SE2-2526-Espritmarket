package esprit_market.mappers;

import esprit_market.dto.forum.*;
import esprit_market.entity.forum.*;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Forum Mapper Tests")
class ForumMapperTest {

    private static final String TEST_ID = new ObjectId().toHexString();
    private static final String USER_ID = new ObjectId().toHexString();
    private static final String CATEGORY_ID = new ObjectId().toHexString();
    private static final String POST_ID = new ObjectId().toHexString();
    private static final String COMMENT_ID = new ObjectId().toHexString();

    @Test
    @DisplayName("Should map Group entity to GroupResponse DTO")
    void testToGroupResponse() {
        // Arrange
        Group group = Group.builder()
                .id(new ObjectId(TEST_ID))
                .name("Test Group")
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(new ObjectId(USER_ID)))
                .messageIds(new ArrayList<>())
                .build();

        // Act
        GroupResponse response = ForumMapper.toGroupResponse(group);

        // Assert
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
        assertEquals("Test Group", response.getName());
        assertEquals("Java", response.getTopic());
        assertEquals("Advanced", response.getLevel());
        assertEquals("Backend", response.getSpeciality());
        assertEquals(1, response.getMemberIds().size());
        assertEquals(USER_ID, response.getMemberIds().get(0));
    }

    @Test
    @DisplayName("Should map GroupRequest DTO to Group entity")
    void testToGroup() {
        // Arrange
        GroupRequest request = GroupRequest.builder()
                .name("Test Group")
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(USER_ID))
                .build();

        // Act
        Group group = ForumMapper.toGroup(request);

        // Assert
        assertNotNull(group);
        assertNull(group.getId());
        assertEquals("Test Group", group.getName());
        assertEquals("Java", group.getTopic());
        assertEquals("Advanced", group.getLevel());
        assertEquals("Backend", group.getSpeciality());
        assertEquals(1, group.getMemberIds().size());
        assertTrue(group.getMessageIds().isEmpty());
    }

    @Test
    @DisplayName("Should map Post entity to PostResponse DTO")
    void testToPostResponse() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        Post post = Post.builder()
                .id(new ObjectId(POST_ID))
                .userId(new ObjectId(USER_ID))
                .categoryId(new ObjectId(CATEGORY_ID))
                .content("Test post content")
                .createdAt(createdAt)
                .isPinned(true)
                .isApproved(false)
                .commentIds(List.of(new ObjectId(COMMENT_ID)))
                .reactionIds(new ArrayList<>())
                .build();

        // Act
        PostResponse response = ForumMapper.toPostResponse(post);

        // Assert
        assertNotNull(response);
        assertEquals(POST_ID, response.getId());
        assertEquals(USER_ID, response.getUserId());
        assertEquals(CATEGORY_ID, response.getCategoryId());
        assertEquals("Test post content", response.getContent());
        assertEquals(createdAt, response.getCreatedAt());
        assertTrue(response.isPinned());
        assertFalse(response.isApproved());
        assertEquals(1, response.getCommentIds().size());
    }

    @Test
    @DisplayName("Should map PostRequest DTO to Post entity")
    void testToPost() {
        // Arrange
        PostRequest request = PostRequest.builder()
                .userId(USER_ID)
                .categoryId(CATEGORY_ID)
                .content("Test post content")
                .build();

        // Act
        Post post = ForumMapper.toPost(request);

        // Assert
        assertNotNull(post);
        assertNull(post.getId());
        assertEquals(USER_ID, post.getUserId().toHexString());
        assertEquals(CATEGORY_ID, post.getCategoryId().toHexString());
        assertEquals("Test post content", post.getContent());
        assertNotNull(post.getCreatedAt());
        assertFalse(post.isPinned());
        assertFalse(post.isApproved());
        assertTrue(post.getCommentIds().isEmpty());
    }

    @Test
    @DisplayName("Should map Comment entity to CommentResponse DTO")
    void testToCommentResponse() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        Comment comment = Comment.builder()
                .id(new ObjectId(COMMENT_ID))
                .postId(new ObjectId(POST_ID))
                .userId(new ObjectId(USER_ID))
                .parentCommentId(null)
                .content("Test comment")
                .createdAt(createdAt)
                .reactionIds(new ArrayList<>())
                .build();

        // Act
        CommentResponse response = ForumMapper.toCommentResponse(comment);

        // Assert
        assertNotNull(response);
        assertEquals(COMMENT_ID, response.getId());
        assertEquals(POST_ID, response.getPostId());
        assertEquals(USER_ID, response.getUserId());
        assertNull(response.getParentCommentId());
        assertEquals("Test comment", response.getContent());
        assertEquals(createdAt, response.getCreatedAt());
    }

    @Test
    @DisplayName("Should map CommentRequest DTO to Comment entity")
    void testToComment() {
        // Arrange
        CommentRequest request = CommentRequest.builder()
                .postId(POST_ID)
                .userId(USER_ID)
                .content("Test comment")
                .build();

        // Act
        Comment comment = ForumMapper.toComment(request);

        // Assert
        assertNotNull(comment);
        assertNull(comment.getId());
        assertEquals(POST_ID, comment.getPostId().toHexString());
        assertEquals(USER_ID, comment.getUserId().toHexString());
        assertNull(comment.getParentCommentId());
        assertEquals("Test comment", comment.getContent());
        assertNotNull(comment.getCreatedAt());
        assertTrue(comment.getReactionIds().isEmpty());
    }

    @Test
    @DisplayName("Should map Reply entity to ReplyResponse DTO")
    void testToReplyResponse() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        Reply reply = Reply.builder()
                .id(new ObjectId(TEST_ID))
                .commentId(new ObjectId(COMMENT_ID))
                .userId(new ObjectId(USER_ID))
                .content("Test reply")
                .createdAt(createdAt)
                .build();

        // Act
        ReplyResponse response = ForumMapper.toReplyResponse(reply);

        // Assert
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
        assertEquals(COMMENT_ID, response.getCommentId());
        assertEquals(USER_ID, response.getUserId());
        assertEquals("Test reply", response.getContent());
        assertEquals(createdAt, response.getCreatedAt());
    }

    @Test
    @DisplayName("Should map ReplyRequest DTO to Reply entity")
    void testToReply() {
        // Arrange
        ReplyRequest request = ReplyRequest.builder()
                .commentId(COMMENT_ID)
                .userId(USER_ID)
                .content("Test reply")
                .build();

        // Act
        Reply reply = ForumMapper.toReply(request);

        // Assert
        assertNotNull(reply);
        assertNull(reply.getId());
        assertEquals(COMMENT_ID, reply.getCommentId().toHexString());
        assertEquals(USER_ID, reply.getUserId().toHexString());
        assertEquals("Test reply", reply.getContent());
        assertNotNull(reply.getCreatedAt());
    }

    @Test
    @DisplayName("Should map Reaction entity to ReactionResponse DTO")
    void testToReactionResponse() {
        // Arrange
        LocalDateTime createdAt = LocalDateTime.now();
        Reaction reaction = Reaction.builder()
                .id(new ObjectId(TEST_ID))
                .type(ReactionType.LIKE)
                .userId(new ObjectId(USER_ID))
                .postId(new ObjectId(POST_ID))
                .commentId(null)
                .createdAt(createdAt)
                .build();

        // Act
        ReactionResponse response = ForumMapper.toReactionResponse(reaction);

        // Assert
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
        assertEquals("LIKE", response.getType());
        assertEquals(USER_ID, response.getUserId());
        assertEquals(POST_ID, response.getPostId());
        assertNull(response.getCommentId());
        assertEquals(createdAt, response.getCreatedAt());
    }

    @Test
    @DisplayName("Should map ReactionRequest DTO to Reaction entity")
    void testToReaction() {
        // Arrange
        ReactionRequest request = ReactionRequest.builder()
                .type("LIKE")
                .userId(USER_ID)
                .postId(POST_ID)
                .build();

        // Act
        Reaction reaction = ForumMapper.toReaction(request);

        // Assert
        assertNotNull(reaction);
        assertNull(reaction.getId());
        assertEquals(ReactionType.LIKE, reaction.getType());
        assertEquals(USER_ID, reaction.getUserId().toHexString());
        assertEquals(POST_ID, reaction.getPostId().toHexString());
        assertNull(reaction.getCommentId());
        assertNotNull(reaction.getCreatedAt());
    }

    @Test
    @DisplayName("Should map CategoryForum entity to CategoryForumResponse DTO")
    void testToCategoryForumResponse() {
        // Arrange
        CategoryForum category = CategoryForum.builder()
                .id(new ObjectId(CATEGORY_ID))
                .name("Java")
                .description("Java Programming")
                .build();

        // Act
        CategoryForumResponse response = ForumMapper.toCategoryForumResponse(category);

        // Assert
        assertNotNull(response);
        assertEquals(CATEGORY_ID, response.getId());
        assertEquals("Java", response.getName());
        assertEquals("Java Programming", response.getDescription());
    }

    @Test
    @DisplayName("Should map CategoryForumRequest DTO to CategoryForum entity")
    void testToCategoryForum() {
        // Arrange
        CategoryForumRequest request = CategoryForumRequest.builder()
                .name("Java")
                .description("Java Programming")
                .build();

        // Act
        CategoryForum category = ForumMapper.toCategoryForum(request);

        // Assert
        assertNotNull(category);
        assertNull(category.getId());
        assertEquals("Java", category.getName());
        assertEquals("Java Programming", category.getDescription());
    }

    @Test
    @DisplayName("Should map Message entity to MessageResponse DTO")
    void testToMessageResponse() {
        // Arrange
        LocalDateTime timestamp = LocalDateTime.now();
        String groupId = new ObjectId().toHexString();
        String receiverId = new ObjectId().toHexString();
        
        Message message = Message.builder()
                .id(new ObjectId(TEST_ID))
                .senderId(new ObjectId(USER_ID))
                .groupId(new ObjectId(groupId))
                .receiverId(new ObjectId(receiverId))
                .replyToMessageId(null)
                .content("Test message")
                .timestamp(timestamp)
                .build();

        // Act
        MessageResponse response = ForumMapper.toMessageResponse(message);

        // Assert
        assertNotNull(response);
        assertEquals(TEST_ID, response.getId());
        assertEquals(USER_ID, response.getSenderId());
        assertEquals(groupId, response.getGroupId());
        assertEquals(receiverId, response.getReceiverId());
        assertNull(response.getReplyToMessageId());
        assertEquals("Test message", response.getContent());
        assertEquals(timestamp, response.getTimestamp());
    }

    @Test
    @DisplayName("Should map MessageRequest DTO to Message entity")
    void testToMessage() {
        // Arrange
        String groupId = new ObjectId().toHexString();
        String receiverId = new ObjectId().toHexString();
        
        MessageRequest request = MessageRequest.builder()
                .senderId(USER_ID)
                .groupId(groupId)
                .receiverId(receiverId)
                .content("Test message")
                .build();

        // Act
        Message message = ForumMapper.toMessage(request);

        // Assert
        assertNotNull(message);
        assertNull(message.getId());
        assertEquals(USER_ID, message.getSenderId().toHexString());
        assertEquals(groupId, message.getGroupId().toHexString());
        assertEquals(receiverId, message.getReceiverId().toHexString());
        assertNull(message.getReplyToMessageId());
        assertEquals("Test message", message.getContent());
        assertNotNull(message.getTimestamp());
    }

    @Test
    @DisplayName("Should handle null entity mapping")
    void testNullEntityMapping() {
        assertNull(ForumMapper.toGroupResponse(null));
        assertNull(ForumMapper.toPostResponse(null));
        assertNull(ForumMapper.toCommentResponse(null));
        assertNull(ForumMapper.toReplyResponse(null));
        assertNull(ForumMapper.toReactionResponse(null));
    }

    @Test
    @DisplayName("Should handle null DTO mapping")
    void testNullDtoMapping() {
        assertNull(ForumMapper.toGroup(null));
        assertNull(ForumMapper.toPost(null));
        assertNull(ForumMapper.toComment(null));
        assertNull(ForumMapper.toReply(null));
        assertNull(ForumMapper.toReaction(null));
    }

    @Test
    @DisplayName("Should convert ObjectId list to String list")
    void testToIdList() {
        // Arrange
        List<ObjectId> objectIds = List.of(
                new ObjectId(USER_ID),
                new ObjectId(POST_ID),
                new ObjectId(COMMENT_ID)
        );

        // Act
        List<String> stringIds = ForumMapper.toIdList(objectIds);

        // Assert
        assertNotNull(stringIds);
        assertEquals(3, stringIds.size());
        assertTrue(stringIds.contains(USER_ID));
        assertTrue(stringIds.contains(POST_ID));
        assertTrue(stringIds.contains(COMMENT_ID));
    }

    @Test
    @DisplayName("Should convert String list to ObjectId list")
    void testToObjectIdList() {
        // Arrange
        List<String> stringIds = List.of(USER_ID, POST_ID, COMMENT_ID);

        // Act
        List<ObjectId> objectIds = ForumMapper.toObjectIdList(stringIds);

        // Assert
        assertNotNull(objectIds);
        assertEquals(3, objectIds.size());
        assertEquals(USER_ID, objectIds.get(0).toHexString());
        assertEquals(POST_ID, objectIds.get(1).toHexString());
        assertEquals(COMMENT_ID, objectIds.get(2).toHexString());
    }

    @Test
    @DisplayName("Should handle empty list mapping")
    void testEmptyListMapping() {
        List<ObjectId> emptyList = new ArrayList<>();
        List<String> stringIds = ForumMapper.toIdList(emptyList);
        
        assertNotNull(stringIds);
        assertTrue(stringIds.isEmpty());
    }

    @Test
    @DisplayName("Should convert ObjectId to String")
    void testToId() {
        // Arrange
        ObjectId objectId = new ObjectId(TEST_ID);

        // Act
        String id = ForumMapper.toId(objectId);

        // Assert
        assertEquals(TEST_ID, id);
    }

    @Test
    @DisplayName("Should convert String to ObjectId")
    void testToObjectId() {
        // Act
        ObjectId objectId = ForumMapper.toObjectId(USER_ID);

        // Assert
        assertNotNull(objectId);
        assertEquals(USER_ID, objectId.toHexString());
    }
}
