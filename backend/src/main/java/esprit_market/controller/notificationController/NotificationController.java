package esprit_market.controller.notificationController;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoCursor;
import esprit_market.dto.notification.NotificationDTO;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/legacy/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification", description = "Gestion des notifications internes et externes")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    private ObjectId resolveUserId(Authentication authentication) {
        if (authentication == null)
            throw new RuntimeException("Authentification requise (JWT manquant)");
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + email));
        return user.getId();
    }

    /** Raw diagnostic — shows exactly what's in MongoDB for this user */
    @GetMapping("/raw")
    public ResponseEntity<Map<String, Object>> raw(Authentication authentication) {
        ObjectId userId = resolveUserId(authentication);
        MongoCollection<Document> col = mongoTemplate.getDb().getCollection("notifications");

        long total = col.countDocuments();
        long withUserId = col.countDocuments(new Document("userId", userId));
        long withUserRef = col.countDocuments(new Document("user.$id", userId));
        long withNotifStatus = col.countDocuments(new Document("notification_status", true));

        List<String> samples = new ArrayList<>();
        try (MongoCursor<Document> c = col.find().limit(5).cursor()) {
            while (c.hasNext()) {
                Document d = c.next();
                samples.add("id=" + d.get("_id")
                    + " | userId=" + d.get("userId")
                    + " | user=" + d.get("user")
                    + " | status=" + d.get("notification_status")
                    + " | title=" + d.get("title"));
            }
        }

        return ResponseEntity.ok(Map.of(
            "myUserId", userId.toHexString(),
            "totalNotifications", total,
            "docsWithUserId", withUserId,
            "docsWithUserRef", withUserRef,
            "docsWithNotifStatusTrue", withNotifStatus,
            "sampleDocs", samples
        ));
    }

    @PostMapping
    @Operation(summary = "Créer une notification ciblée")
    public ResponseEntity<NotificationDTO> create(
            @Valid @RequestBody NotificationDTO dto,
            @Parameter(description = "ID de l'utilisateur destinataire") @RequestParam(required = false) String userId,
            Authentication authentication) {
        ObjectId effectiveId = (userId != null && !userId.isEmpty()) ? new ObjectId(userId)
                : resolveUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationService.createNotification(dto, effectiveId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(notificationService.getNotificationById(new ObjectId(id)));
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAll() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NotificationDTO> deactivate(@PathVariable String id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.deactivateNotification(new ObjectId(id), resolveUserId(authentication)));
    }

    @GetMapping("/my")
    public ResponseEntity<List<NotificationDTO>> getMy(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getMyNotifications(resolveUserId(authentication)));
    }

    @GetMapping("/my/unread")
    public ResponseEntity<List<NotificationDTO>> getMyUnread(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getMyUnreadNotifications(resolveUserId(authentication)));
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<NotificationDTO>> getByType(@PathVariable NotificationType type) {
        return ResponseEntity.ok(notificationService.getNotificationsByType(type));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable String id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.markAsRead(new ObjectId(id), resolveUserId(authentication)));
    }

    @PatchMapping("/{id}/star")
    public ResponseEntity<NotificationDTO> toggleStar(@PathVariable String id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.toggleStar(new ObjectId(id), resolveUserId(authentication)));
    }

    @PatchMapping("/{id}/follow")
    public ResponseEntity<NotificationDTO> toggleFollow(@PathVariable String id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.toggleFollow(new ObjectId(id), resolveUserId(authentication)));
    }

    @PostMapping("/bulk-read")
    public ResponseEntity<Void> bulkRead(@RequestBody List<String> ids, Authentication authentication) {
        notificationService.bulkMarkAsRead(ids.stream().map(ObjectId::new).toList(), resolveUserId(authentication));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-delete")
    public ResponseEntity<Void> bulkDelete(@RequestBody List<String> ids, Authentication authentication) {
        notificationService.bulkDelete(ids.stream().map(ObjectId::new).toList(), resolveUserId(authentication));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bulk-star")
    public ResponseEntity<Void> bulkStar(@RequestBody Map<String, Object> payload, Authentication authentication) {
        List<String> ids = (List<String>) payload.get("ids");
        boolean star = (boolean) payload.get("star");
        notificationService.bulkToggleStar(ids.stream().map(ObjectId::new).toList(), star, resolveUserId(authentication));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/broadcast")
    public ResponseEntity<NotificationDTO> broadcast(@Valid @RequestBody NotificationDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.broadcast(dto));
    }
}
