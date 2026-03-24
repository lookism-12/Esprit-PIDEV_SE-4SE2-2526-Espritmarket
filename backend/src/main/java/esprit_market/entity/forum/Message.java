package esprit_market.entity.forum;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    private ObjectId id;
    private ObjectId senderId;
    private ObjectId groupId;   // for group chat
    private ObjectId receiverId; // for direct message (optional)
    private ObjectId replyToMessageId; // optional: reply to another message
    private String content;
    private LocalDateTime timestamp;
}
