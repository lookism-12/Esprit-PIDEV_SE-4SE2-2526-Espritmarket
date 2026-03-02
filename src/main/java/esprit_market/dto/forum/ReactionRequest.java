package esprit_market.dto.forum;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for creating a Reaction.
 * Reactions are typically immutable (no updates).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionRequest {
    @NotBlank(message = "Reaction type is required")
    private String type;

    @NotBlank(message = "User ID is required")
    private String userId;

    private String postId;
    private String commentId;
}
