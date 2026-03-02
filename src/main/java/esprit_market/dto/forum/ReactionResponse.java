package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;

/**
 * Response DTO for Reaction entity.
 * Contains all fields that should be exposed to the client.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionResponse {
    private String id;
    private String type;
    private String userId;
    private String postId;
    private String commentId;
    private LocalDateTime createdAt;
}
