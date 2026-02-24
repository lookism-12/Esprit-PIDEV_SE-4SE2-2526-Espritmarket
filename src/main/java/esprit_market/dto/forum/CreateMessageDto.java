package esprit_market.dto.forum;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMessageDto {
    private String senderId;
    private String groupId;
    private String receiverId;
    private String replyToMessageId;
    private String content;
}
