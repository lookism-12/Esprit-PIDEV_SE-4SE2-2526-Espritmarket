package esprit_market.dto.forum;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Request DTO for creating or updating a Message.
 * Merges CreateMessageDto and UpdateMessageDto.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    @NotBlank(message = "Sender ID is required")
    private String senderId;

    @NotBlank(message = "Group ID is required")
    private String groupId;

    private String receiverId;
    private String replyToMessageId;

    @NotBlank(message = "Content is required")
    @Size(min = 1, max = 3000, message = "Content must be between 1 and 3000 characters")
    private String content;
}
