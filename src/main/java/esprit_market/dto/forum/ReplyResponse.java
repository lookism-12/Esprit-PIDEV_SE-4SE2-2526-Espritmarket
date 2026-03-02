package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;

/**
 * Response DTO for Reply entity.
 * Contains all fields that should be exposed to the client.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyResponse {
    private String id;
    private String commentId;
    private String userId;
    private String content;
    private LocalDateTime createdAt;
}
