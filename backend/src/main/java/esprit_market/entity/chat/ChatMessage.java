package esprit_market.entity.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    private String id; 

    private String conversationId; 
    private String senderId;
    private String receiverId;
    private String content;
    private String messageType;
    private Integer voiceDuration;

    private LocalDateTime timestamp;
}
