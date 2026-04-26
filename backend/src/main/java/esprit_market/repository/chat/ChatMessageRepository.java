package esprit_market.repository.chat;

import esprit_market.entity.chat.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByConversationIdOrderByTimestampAsc(String conversationId);
    List<ChatMessage> findByConversationIdInOrderByTimestampAsc(List<String> conversationIds);
}
