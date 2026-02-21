package esprit_market.entity;

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

    // User — Message (OneToMany BIDIRECTIONAL)
    private ObjectId senderId;

    private ObjectId receiverId; // Optional if message is direct

    private String content;
    private LocalDateTime timestamp;
}
