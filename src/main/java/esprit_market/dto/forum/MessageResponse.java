package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;

/**
 * Response DTO for Message entity.
 * Contains all fields that should be exposed to the client.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String id;
    private String senderId;
    private String groupId;
    private String receiverId;
    private String replyToMessageId;
    private String content;
    private LocalDateTime timestamp;
    private LocalDateTime updatedAt;
}
