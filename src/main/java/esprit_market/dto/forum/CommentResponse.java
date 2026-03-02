package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for Comment entity.
 * Contains all fields that should be exposed to the client.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private String id;
    private String postId;
    private String userId;
    private String parentCommentId;
    private String content;
    private LocalDateTime createdAt;
    private List<String> reactionIds;
}
