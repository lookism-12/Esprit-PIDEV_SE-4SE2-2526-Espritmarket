package esprit_market.controller.chat;

import esprit_market.entity.chat.ChatConversation;
import esprit_market.entity.chat.ChatMessage;
import esprit_market.service.chat.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    /**
     * Bulk presence lookup — returns a map of userId → status ("online" | "away" | "offline").
     * The frontend calls this once after loading the conversation list to seed the presence UI.
     * Since presence is tracked in-memory via STOMP, we return "offline" for any user not
     * currently tracked; the real-time STOMP topic will update the UI as users come online.
     */
    @PostMapping("/presence/bulk")
    public ResponseEntity<Map<String, String>> getBulkPresence(@RequestBody List<String> userIds) {
        Map<String, String> result = new java.util.HashMap<>();
        for (String id : userIds) {
            result.put(id, "offline"); // default; real-time updates come via STOMP /topic/presence
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/ping")
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Chat API is alive");
    }
}
