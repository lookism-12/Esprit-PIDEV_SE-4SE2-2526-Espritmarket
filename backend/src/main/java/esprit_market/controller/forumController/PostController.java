package esprit_market.controller.forumController;

import esprit_market.dto.forum.PostRequest;
import esprit_market.dto.forum.PostResponse;
import esprit_market.dto.forum.ReactionRequest;
import esprit_market.dto.forum.RecommendedForumPost;
import esprit_market.entity.forum.Post;
import esprit_market.entity.forum.Reaction;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.ForumRecommendationService;
import esprit_market.service.forumService.PostService;
import esprit_market.service.forumService.ReactionService;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService service;
    private final ReactionService reactionService;
    private final ForumRecommendationService recommendationService;
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
        return userRepository.findByEmail(email).map(u -> u.getId()).orElse(null);
    }

    @GetMapping
    public List<PostResponse> getAll() {
        return service.findAll().stream().map(ForumMapper::toPostResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> findById(@PathVariable String id) {
        Post entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toPostResponse(entity));
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(@Valid @RequestBody PostRequest dto) {
        Post entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        PostResponse response = ForumMapper.toPostResponse(entity);
        response.setRecommendedPosts(recommendationService.getRecommendations(entity));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/recommendations")
    public ResponseEntity<List<RecommendedForumPost>> getRecommendations(@PathVariable String id) {
        Post entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(recommendationService.getRecommendations(entity));
    }

    /**
     * Semantic search: finds posts semantically similar to the given query text.
     * Proxies to the AI forum recommendation service (all-MiniLM-L6-v2 + FAISS).
     * Falls back to keyword matching when the AI service is unavailable.
     */
    @GetMapping("/search")
    public ResponseEntity<List<RecommendedForumPost>> semanticSearch(
            @RequestParam String q,
            @RequestParam(defaultValue = "8") int topK) {
        if (q == null || q.isBlank()) {
            return ResponseEntity.ok(List.of());
        }
        List<RecommendedForumPost> results = recommendationService.semanticSearch(q.trim(), topK);
        return ResponseEntity.ok(results);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> update(@PathVariable String id, @Valid @RequestBody PostRequest dto) {
        Post existing = service.findById(new ObjectId(id));
        if (existing == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (!isAdmin() && (currentUserId == null || !existing.getUserId().equals(currentUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Post entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toPostResponse(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        Post existing = service.findById(new ObjectId(id));
        if (existing == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (!isAdmin() && (currentUserId == null || !existing.getUserId().equals(currentUserId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{postId}/react")
    public ResponseEntity<Void> reactToPost(
            @PathVariable String postId,
            @Valid @RequestBody ReactionRequest reactionRequest) {
        
        Post post = service.findById(new ObjectId(postId));
        if (post == null) return ResponseEntity.notFound().build();

        ObjectId currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        reactionRequest.setUserId(currentUserId.toHexString());
        reactionRequest.setPostId(postId);
        
        Reaction reaction = reactionService.create(reactionRequest);
        if (reaction == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok().build();
    }
}
