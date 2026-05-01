package esprit_market.service.chat;

import esprit_market.dto.chat.ChatMessagePayload;
import esprit_market.entity.chat.ChatConversation;
import esprit_market.entity.chat.ChatMessage;
import esprit_market.repository.chat.ChatConversationRepository;
import esprit_market.repository.chat.ChatMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

    private final ChatConversationRepository chatConversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final FlameService flameService;

    public ChatService(ChatConversationRepository chatConversationRepository, 
                      ChatMessageRepository chatMessageRepository, 
                      FlameService flameService) {
        this.chatConversationRepository = chatConversationRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.flameService = flameService;
    }

    @Transactional
    public ChatMessage saveMessage(ChatMessagePayload payload) {
        LocalDateTime now = LocalDateTime.now();
        
        String u1 = payload.getSenderId();
        String u2 = payload.getReceiverId();
        if (u1 == null || u2 == null || u1.equals(u2)) {
             return null;
        }

        String finalConversationId = u1.compareTo(u2) < 0 ? u1 + "_" + u2 : u2 + "_" + u1;
        payload.setConversationId(finalConversationId);

        ChatConversation conversation = chatConversationRepository.findByConversationId(finalConversationId)
                .orElseGet(() -> ChatConversation.builder()
                        .conversationId(finalConversationId)
                        .user1Id(u1.compareTo(u2) < 0 ? u1 : u2)
                        .user2Id(u1.compareTo(u2) < 0 ? u2 : u1)
                        .flameLevel(0)
                        .messageCount(0)
                        .user1SentToday(false)
                        .user2SentToday(false)
                        .build());

        // BUG 4 FIX: Use proper FlameService logic
        conversation.setMessageCount(conversation.getMessageCount() + 1);
        conversation.setLastMessageDate(now);
        conversation.setLastMessageContent("voice".equalsIgnoreCase(payload.getMessageType()) ? "Voice message" : payload.getContent());
        
        // NEW LOGIC: Increase flame every 10 messages
        conversation.setFlameLevel(conversation.getMessageCount() / 10);

        // BUG 3 FIX: No .id() here, let MongoDB generate it
        chatConversationRepository.save(conversation);

        ChatMessage chatMessage = ChatMessage.builder()
                .conversationId(finalConversationId)
                .senderId(payload.getSenderId())
                .receiverId(payload.getReceiverId())
                .content(payload.getContent())
                .messageType(payload.getMessageType())
                .voiceDuration(payload.getVoiceDuration())
                .timestamp(now)
                .build();

        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getHistory(String conversationId) {
        if (conversationId == null || conversationId.isEmpty()) return List.of();
        
        // BUG 2 FIX: Robust split logic
        int idx = conversationId.lastIndexOf("_");
        if (idx == -1) {
            return chatMessageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
        }
        
        String id1 = conversationId.substring(0, idx);
        String id2 = conversationId.substring(idx + 1);
        String altId = id2 + "_" + id1;
        
        return chatMessageRepository.findByConversationIdInOrderByTimestampAsc(List.of(conversationId, altId));
    }

    public List<ChatConversation> getUserConversations(String userId) {
        if (userId == null || userId.isEmpty() || "null".equals(userId)) return List.of();
        return chatConversationRepository.findByParticipantId(userId);
    }

    @Transactional
    public ChatConversation getOrCreateConversation(String firstUserId, String secondUserId) {
        if (firstUserId == null || secondUserId == null || firstUserId.equals(secondUserId)) {
            throw new IllegalArgumentException("Two different users are required to open a chat");
        }

        String conversationId = firstUserId.compareTo(secondUserId) < 0
                ? firstUserId + "_" + secondUserId
                : secondUserId + "_" + firstUserId;

        return chatConversationRepository.findByConversationId(conversationId)
                .orElseGet(() -> chatConversationRepository.save(ChatConversation.builder()
                        .conversationId(conversationId)
                        .user1Id(firstUserId.compareTo(secondUserId) < 0 ? firstUserId : secondUserId)
                        .user2Id(firstUserId.compareTo(secondUserId) < 0 ? secondUserId : firstUserId)
                        .flameLevel(0)
                        .messageCount(0)
                        .user1SentToday(false)
                        .user2SentToday(false)
                        .build()));
    }
}
