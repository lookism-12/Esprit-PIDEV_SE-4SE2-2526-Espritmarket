package esprit_market.dto.forum;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DisplayName("Forum DTO Validation Tests")
class ForumDtoValidationTest {

    @Autowired
    private Validator validator;

    private static final String VALID_ID = "507f1f77bcf86cd799439011";

    @Test
    @DisplayName("Should validate valid GroupRequest")
    void testValidGroupRequest() {
        // Arrange
        GroupRequest request = GroupRequest.builder()
                .name("Java Developers")
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(VALID_ID, VALID_ID))
                .build();

        // Act
        Set<ConstraintViolation<GroupRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail GroupRequest with blank name")
    void testGroupRequestBlankName() {
        // Arrange
        GroupRequest request = GroupRequest.builder()
                .name("   ")
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(VALID_ID, VALID_ID))
                .build();

        // Act
        Set<ConstraintViolation<GroupRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("name")));
    }

    @Test
    @DisplayName("Should fail GroupRequest with null name")
    void testGroupRequestNullName() {
        // Arrange
        GroupRequest request = GroupRequest.builder()
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(VALID_ID, VALID_ID))
                .build();

        // Act
        Set<ConstraintViolation<GroupRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail GroupRequest with insufficient members")
    void testGroupRequestMinimumMembers() {
        // Arrange
        GroupRequest request = GroupRequest.builder()
                .name("Java Developers")
                .topic("Java")
                .level("Advanced")
                .speciality("Backend")
                .memberIds(List.of(VALID_ID)) // Only 1 member
                .build();

        // Act
        Set<ConstraintViolation<GroupRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("memberIds")));
    }

    @Test
    @DisplayName("Should validate valid PostRequest")
    void testValidPostRequest() {
        // Arrange
        PostRequest request = PostRequest.builder()
                .userId(VALID_ID)
                .categoryId(VALID_ID)
                .content("This is a great post about Java programming")
                .build();

        // Act
        Set<ConstraintViolation<PostRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail PostRequest with blank content")
    void testPostRequestBlankContent() {
        // Arrange
        PostRequest request = PostRequest.builder()
                .userId(VALID_ID)
                .categoryId(VALID_ID)
                .content("   ")
                .build();

        // Act
        Set<ConstraintViolation<PostRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("content")));
    }

    @Test
    @DisplayName("Should fail PostRequest with content exceeding max size")
    void testPostRequestContentTooLong() {
        // Arrange
        String longContent = "a".repeat(5001);
        PostRequest request = PostRequest.builder()
                .userId(VALID_ID)
                .categoryId(VALID_ID)
                .content(longContent)
                .build();

        // Act
        Set<ConstraintViolation<PostRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
                .anyMatch(v -> v.getPropertyPath().toString().equals("content")));
    }

    @Test
    @DisplayName("Should fail PostRequest with null userId")
    void testPostRequestNullUserId() {
        // Arrange
        PostRequest request = PostRequest.builder()
                .categoryId(VALID_ID)
                .content("Valid content here")
                .build();

        // Act
        Set<ConstraintViolation<PostRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should validate valid CommentRequest")
    void testValidCommentRequest() {
        // Arrange
        CommentRequest request = CommentRequest.builder()
                .postId(VALID_ID)
                .userId(VALID_ID)
                .content("Great discussion point!")
                .build();

        // Act
        Set<ConstraintViolation<CommentRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail CommentRequest with blank content")
    void testCommentRequestBlankContent() {
        // Arrange
        CommentRequest request = CommentRequest.builder()
                .postId(VALID_ID)
                .userId(VALID_ID)
                .content("")
                .build();

        // Act
        Set<ConstraintViolation<CommentRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail CommentRequest with content exceeding max size")
    void testCommentRequestContentTooLong() {
        // Arrange
        String longContent = "a".repeat(2001);
        CommentRequest request = CommentRequest.builder()
                .postId(VALID_ID)
                .userId(VALID_ID)
                .content(longContent)
                .build();

        // Act
        Set<ConstraintViolation<CommentRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should validate valid ReplyRequest")
    void testValidReplyRequest() {
        // Arrange
        ReplyRequest request = ReplyRequest.builder()
                .commentId(VALID_ID)
                .userId(VALID_ID)
                .content("I agree with that point")
                .build();

        // Act
        Set<ConstraintViolation<ReplyRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail ReplyRequest with blank content")
    void testReplyRequestBlankContent() {
        // Arrange
        ReplyRequest request = ReplyRequest.builder()
                .commentId(VALID_ID)
                .userId(VALID_ID)
                .content("  \n  ")
                .build();

        // Act
        Set<ConstraintViolation<ReplyRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should validate valid ReactionRequest")
    void testValidReactionRequest() {
        // Arrange
        ReactionRequest request = ReactionRequest.builder()
                .type("LIKE")
                .userId(VALID_ID)
                .postId(VALID_ID)
                .build();

        // Act
        Set<ConstraintViolation<ReactionRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail ReactionRequest with blank type")
    void testReactionRequestBlankType() {
        // Arrange
        ReactionRequest request = ReactionRequest.builder()
                .type("")
                .userId(VALID_ID)
                .postId(VALID_ID)
                .build();

        // Act
        Set<ConstraintViolation<ReactionRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should validate valid CategoryForumRequest")
    void testValidCategoryForumRequest() {
        // Arrange
        CategoryForumRequest request = CategoryForumRequest.builder()
                .name("Java Programming")
                .description("All about Java and related technologies")
                .build();

        // Act
        Set<ConstraintViolation<CategoryForumRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail CategoryForumRequest with blank name")
    void testCategoryForumRequestBlankName() {
        // Arrange
        CategoryForumRequest request = CategoryForumRequest.builder()
                .name("")
                .description("All about Java and related technologies")
                .build();

        // Act
        Set<ConstraintViolation<CategoryForumRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should validate valid MessageRequest")
    void testValidMessageRequest() {
        // Arrange
        MessageRequest request = MessageRequest.builder()
                .senderId(VALID_ID)
                .groupId(VALID_ID)
                .receiverId(VALID_ID)
                .content("Hello, how are you?")
                .build();

        // Act
        Set<ConstraintViolation<MessageRequest>> violations = validator.validate(request);

        // Assert
        assertTrue(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail MessageRequest with blank content")
    void testMessageRequestBlankContent() {
        // Arrange
        MessageRequest request = MessageRequest.builder()
                .senderId(VALID_ID)
                .groupId(VALID_ID)
                .receiverId(VALID_ID)
                .content("   ")
                .build();

        // Act
        Set<ConstraintViolation<MessageRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should fail MessageRequest with content exceeding max size")
    void testMessageRequestContentTooLong() {
        // Arrange
        String longContent = "a".repeat(3001);
        MessageRequest request = MessageRequest.builder()
                .senderId(VALID_ID)
                .groupId(VALID_ID)
                .receiverId(VALID_ID)
                .content(longContent)
                .build();

        // Act
        Set<ConstraintViolation<MessageRequest>> violations = validator.validate(request);

        // Assert
        assertFalse(violations.isEmpty());
    }

    @Test
    @DisplayName("Should validate PostResponse has no validation")
    void testPostResponseNoValidation() {
        // Arrange
        PostResponse response = PostResponse.builder()
                .id(VALID_ID)
                .userId(VALID_ID)
                .categoryId(VALID_ID)
                .content("")
                .pinned(true)
                .approved(false)
                .build();

        // Act
        Set<ConstraintViolation<PostResponse>> violations = validator.validate(response);

        // Assert
        assertTrue(violations.isEmpty(), "Response DTOs should not have validation");
    }

    @Test
    @DisplayName("Should validate GroupResponse has no validation")
    void testGroupResponseNoValidation() {
        // Arrange
        GroupResponse response = GroupResponse.builder()
                .id(VALID_ID)
                .name("")
                .build();

        // Act
        Set<ConstraintViolation<GroupResponse>> violations = validator.validate(response);

        // Assert
        assertTrue(violations.isEmpty(), "Response DTOs should not have validation");
    }
}
