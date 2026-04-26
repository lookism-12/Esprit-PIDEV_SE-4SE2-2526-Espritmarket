package esprit_market.entity.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_conversations")
public class ChatConversation {
    @Id
    private String id;  // MongoDB _id

    @Indexed(unique = true)
    private String conversationId; // Format: userId1_userId2 (sorted)

    private String user1Id;
    private String user2Id;

    private String lastMessageContent;
    private LocalDateTime lastMessageDate;
    private int messageCount;

    // Flame System Fields
    private int flameLevel;
    private LocalDate lastFlameDate;
    private boolean user1SentToday;
    private boolean user2SentToday;

    // Transient field for UI convenience (not stored in DB)
    private Object otherUser;
}
