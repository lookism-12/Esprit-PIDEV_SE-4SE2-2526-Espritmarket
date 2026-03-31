package esprit_market.controller.forumController;

import esprit_market.dto.forum.CommentRequest;
import esprit_market.dto.forum.CommentResponse;
import esprit_market.entity.forum.Comment;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.CommentService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.entity.user.User;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService service;
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
    public List<CommentResponse> findAll() {
        return service.findAll().stream().map(ForumMapper::toCommentResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentResponse> findById(@PathVariable String id) {
        Comment entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toCommentResponse(entity));
    }
   
    @PostMapping
    public ResponseEntity<CommentResponse> create(@RequestBody CommentRequest dto) {
        Comment entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toCommentResponse(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> update(@PathVariable String id, @RequestBody CommentRequest dto) {
        Comment existing = service.findById(new ObjectId(id));
        if (existing == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (!isAdmin() && (currentUserId == null || !existing.getUserId().equals(currentUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Comment entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toCommentResponse(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        Comment existing = service.findById(new ObjectId(id));
        if (existing == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (!isAdmin() && (currentUserId == null || !existing.getUserId().equals(currentUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
