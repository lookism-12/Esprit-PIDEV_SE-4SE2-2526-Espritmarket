package esprit_market.controller.forumController;

import esprit_market.dto.forum.ReactionRequest;
import esprit_market.dto.forum.ReactionResponse;
import esprit_market.entity.forum.Reaction;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.ReactionService;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import esprit_market.entity.user.User;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/reactions")
@RequiredArgsConstructor
public class ReactionController {
    private final ReactionService service;
    private final UserRepository userRepository;

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private ObjectId getCurrentUserId() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth != null ? auth.getName() : null;
        if (email == null) return null;
        return userRepository.findByEmail(email).map(User::getId).orElse(null);
    }

    @GetMapping
    public List<ReactionResponse> getAll() {
        return service.findAll().stream().map(ForumMapper::toReactionResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReactionResponse> findById(@PathVariable String id) {
        Reaction entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toReactionResponse(entity));
    }

    @PostMapping
    public ResponseEntity<ReactionResponse> create(@Valid @RequestBody ReactionRequest dto) {
        Reaction entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toReactionResponse(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        Reaction existing = service.findById(new ObjectId(id));
        if (existing == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (!isAdmin() && (currentUserId == null || !existing.getUserId().equals(currentUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
