package esprit_market.controller.forumController;

import esprit_market.dto.forum.ReplyRequest;
import esprit_market.dto.forum.ReplyResponse;
import esprit_market.entity.forum.Reply;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.ReplyService;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import esprit_market.entity.user.User;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/replies")
@RequiredArgsConstructor
public class ReplyController {
    private final ReplyService service;
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
    public List<ReplyResponse> getAll() {
        return service.findAll().stream().map(ForumMapper::toReplyResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReplyResponse> findById(@PathVariable String id) {
        Reply entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toReplyResponse(entity));
    }

    @PostMapping
    public ResponseEntity<ReplyResponse> create(@Valid @RequestBody ReplyRequest dto) {
        Reply entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toReplyResponse(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReplyResponse> update(@PathVariable String id, @Valid @RequestBody ReplyRequest dto) {
        Reply existing = service.findById(new ObjectId(id));
        if (existing == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (!isAdmin() && (currentUserId == null || !existing.getUserId().equals(currentUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Reply entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toReplyResponse(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        Reply existing = service.findById(new ObjectId(id));
        if (existing == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (!isAdmin() && (currentUserId == null || !existing.getUserId().equals(currentUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
