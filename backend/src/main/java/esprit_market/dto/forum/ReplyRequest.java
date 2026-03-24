package esprit_market.dto.forum;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for creating or updating a Reply.
 * Merges CreateReplyDto and UpdateReplyDto.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyRequest {
    @NotBlank(message = "Comment ID is required")
    private String commentId;

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 2000, message = "Content must be between 1 and 2000 characters")
    private String content;
}
