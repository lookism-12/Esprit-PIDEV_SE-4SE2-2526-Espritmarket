package esprit_market.controller.notificationController;

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
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notification", description = "Gestion des notifications internes et externes")
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // Résolution de l'ObjectId depuis le JWT (email → User → id)
    private ObjectId resolveUserId(Authentication authentication) {
        if (authentication == null)
            throw new RuntimeException("Authentification requise (JWT manquant)");
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + email));
        return user.getId();
    }

    // ─────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Créer une notification ciblée", description = "L'ID utilisateur peut être passé en paramètre pour le test (ADMIN)")
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
    @Operation(summary = "Récupérer une notification par ID")
    public ResponseEntity<NotificationDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(notificationService.getNotificationById(new ObjectId(id)));
    }

    @GetMapping
    @Operation(summary = "Toutes les notifications — ADMIN")
    public ResponseEntity<List<NotificationDTO>> getAll() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une notification — ADMIN")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication authentication) {
        ObjectId userId = resolveUserId(authentication);
        notificationService.deleteNotification(new ObjectId(id), userId);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────
    // Mes notifications (utilisateur connecté)
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/my")
    @Operation(summary = "Mes notifications (basé sur le JWT)")
    public ResponseEntity<List<NotificationDTO>> getMy(Authentication authentication) {
        ObjectId userId = resolveUserId(authentication);
        return ResponseEntity.ok(notificationService.getMyNotifications(userId));
    }

    @GetMapping("/my/unread")
    @Operation(summary = "Mes notifications non lues (basé sur le JWT)")
    public ResponseEntity<List<NotificationDTO>> getMyUnread(Authentication authentication) {
        ObjectId userId = resolveUserId(authentication);
        return ResponseEntity.ok(notificationService.getMyUnreadNotifications(userId));
    }

    // ─────────────────────────────────────────────────────────────
    // Filtres
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/type/{type}")
    @Operation(summary = "Notifications par type (INTERNAL_NOTIFICATION / EXTERNAL_NOTIFICATION)")
    public ResponseEntity<List<NotificationDTO>> getByType(@PathVariable NotificationType type) {
        return ResponseEntity.ok(notificationService.getNotificationsByType(type));
    }

    // ─────────────────────────────────────────────────────────────
    // Actions métier
    // ─────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/read")
    @Operation(summary = "Marquer une notification comme lue")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable String id, Authentication authentication) {
        ObjectId userId = resolveUserId(authentication);
        return ResponseEntity.ok(notificationService.markAsRead(new ObjectId(id), userId));
    }

    @PostMapping("/broadcast")
    @Operation(summary = "Notification globale pour tous — ex: Black Friday, promotions (ADMIN)")
    public ResponseEntity<NotificationDTO> broadcast(@Valid @RequestBody NotificationDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(notificationService.broadcast(dto));
    }
}