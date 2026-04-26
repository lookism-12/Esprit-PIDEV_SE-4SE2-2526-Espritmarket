package esprit_market.controller.forumController;

import esprit_market.dto.forum.GroupRequest;
import esprit_market.dto.forum.GroupResponse;
import esprit_market.entity.forum.Group;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.GroupService;
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
@RequestMapping("/api/forum/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService service;
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
    public List<GroupResponse> getAll() {
        return service.findAll().stream().map(ForumMapper::toGroupResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> findById(@PathVariable String id) {
        Group entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toGroupResponse(entity));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody GroupRequest dto) {
        try {
            Group entity = service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toGroupResponse(entity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody GroupRequest dto) {
        try {
            Group existing = service.findById(new ObjectId(id));
            if (existing == null) return ResponseEntity.notFound().build();

            ObjectId currentUserId = getCurrentUserId();
            if (!isAdmin() && (currentUserId == null || !existing.getMemberIds().contains(currentUserId))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Group entity = service.update(new ObjectId(id), dto);
            return ResponseEntity.ok(ForumMapper.toGroupResponse(entity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        Group existing = service.findById(new ObjectId(id));
        if (existing == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (!isAdmin() && (currentUserId == null || !existing.getMemberIds().contains(currentUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
