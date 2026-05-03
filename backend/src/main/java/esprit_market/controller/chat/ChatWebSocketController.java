package esprit_market.controller.chat;

import esprit_market.dto.chat.ChatMessagePayload;
import esprit_market.entity.chat.ChatMessage;
import esprit_market.service.chat.ChatService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessagePayload chatMessagePayload) {
        ChatMessage savedMessage = chatService.saveMessage(chatMessagePayload);
        if (savedMessage == null) return;
        messagingTemplate.convertAndSend("/topic/chat/" + savedMessage.getConversationId(), savedMessage);
    }

    /**
     * WebRTC signaling relay — routes call-request, offer, answer, ice-candidate
     * and call control signals (call-accept, call-reject, call-end) to the
     * intended receiver via their personal queue.
     *
     * Frontend sends to: /app/chat.signal
     * Backend delivers to: /topic/signal/<receiverId>
     */
    @MessageMapping("/chat.signal")
    public void relaySignal(@Payload SignalPayload signal) {
        if (signal.getReceiverId() == null || signal.getReceiverId().isBlank()) return;
        System.out.println("📡 Signal relay: " + signal.getType()
                + " from=" + signal.getSenderId()
                + " to=" + signal.getReceiverId());
        // Deliver to a topic scoped to the receiver — every client subscribes to
        // /topic/signal/<their-own-userId> so only the intended party gets it.
        messagingTemplate.convertAndSend(
                "/topic/signal/" + signal.getReceiverId(), signal);
    }

    /**
     * Presence updates — broadcast to all connected clients.
     */
    @MessageMapping("/chat.presence")
    public void handlePresence(@Payload Object presence) {
        messagingTemplate.convertAndSend("/topic/presence", presence);
    }

    /**
     * Typing indicators — broadcast to the conversation topic.
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload Object typing) {
        messagingTemplate.convertAndSend("/topic/typing", typing);
    }

    // ── Signal DTO ────────────────────────────────────────────────────────

    @Data
    public static class SignalPayload {
        private String type;
        private String conversationId;
        private String senderId;
        private String receiverId;
        private String sdp;
        private String candidate;
    }
}
