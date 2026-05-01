package esprit_market.controller.chat;

import esprit_market.entity.chat.ChatConversation;
import esprit_market.entity.chat.ChatMessage;
import esprit_market.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatRestController {

    private final ChatService chatService;

    @GetMapping("/history/{conversationId}")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable String conversationId) {
        System.out.println("🔥 HIT /api/chat/history/" + conversationId);
        if (conversationId == null || conversationId.isEmpty() || "null".equals(conversationId)) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        return ResponseEntity.ok(chatService.getHistory(conversationId));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ChatConversation>> getUserConversations(@RequestParam("userId") String userId) {
        System.out.println("🔥 REQUESTED INBOX FOR: " + userId);
        if (userId == null || userId.trim().isEmpty() || "null".equals(userId)) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        List<ChatConversation> results = chatService.getUserConversations(userId);
        System.out.println("🔥 FOUND " + results.size() + " CONVERSATIONS FOR " + userId);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/conversations/open")
    public ResponseEntity<ChatConversation> openConversation(@RequestParam("user1Id") String user1Id,
                                                            @RequestParam("user2Id") String user2Id) {
        return ResponseEntity.ok(chatService.getOrCreateConversation(user1Id, user2Id));
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Chat API is alive");
    }
}
