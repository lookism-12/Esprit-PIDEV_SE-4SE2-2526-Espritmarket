package esprit_market.dto.forum;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private String id;
    private String senderId;
    private String groupId;
    private String receiverId;
    private String replyToMessageId;
    private String content;
    private LocalDateTime timestamp;
}
