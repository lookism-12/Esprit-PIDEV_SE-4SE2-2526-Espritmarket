package esprit_market.repository.chat;

import esprit_market.entity.chat.ChatConversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatConversationRepository extends MongoRepository<ChatConversation, String> {
    
    Optional<ChatConversation> findByConversationId(String conversationId);

    @Query("{$or: [{ 'user1Id': ?0 }, { 'user2Id': ?0 }]}")
    List<ChatConversation> findByParticipantId(String userId);

    List<ChatConversation> findByUser1IdOrUser2Id(String u1, String u2);
}
