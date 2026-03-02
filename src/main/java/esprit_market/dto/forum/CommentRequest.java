package esprit_market.dto.forum;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for creating or updating a Comment.
 * Merges CreateCommentDto and UpdateCommentDto.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequest {
    @NotBlank(message = "Post ID is required")
    private String postId;

    @NotBlank(message = "User ID is required")
    private String userId;

    private String parentCommentId;

    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 2000, message = "Content must be between 1 and 2000 characters")
    private String content;
}
