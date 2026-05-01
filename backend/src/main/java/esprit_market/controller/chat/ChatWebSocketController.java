package esprit_market.controller.chat;

import esprit_market.dto.chat.ChatMessagePayload;
import esprit_market.entity.chat.ChatMessage;
import esprit_market.service.chat.ChatService;
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
        // Save the message and update the flame system
        ChatMessage savedMessage = chatService.saveMessage(chatMessagePayload);
        if (savedMessage == null) {
            return;
        }

        // Broadcast the saved message so clients receive id, messageType and voiceDuration.
        messagingTemplate.convertAndSend("/topic/chat/" + savedMessage.getConversationId(), savedMessage);
    }
}
