package esprit_market.controller.forumController;

import esprit_market.dto.forum.CategoryForumRequest;
import esprit_market.dto.forum.CategoryForumResponse;
import esprit_market.entity.forum.CategoryForum;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.CategoryForumService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/categories")
@RequiredArgsConstructor
public class CategoryForumController {
    private final CategoryForumService service;

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                .stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    @GetMapping
    public List<CategoryForumResponse> findAll() {
        return service.findAll().stream().map(ForumMapper::toCategoryForumResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryForumResponse> findById(@PathVariable String id) {
        CategoryForum entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toCategoryForumResponse(entity));
    }

    @PostMapping
    public ResponseEntity<CategoryForumResponse> create(@Valid @RequestBody CategoryForumRequest dto) {
        if (!isAdmin()) return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        CategoryForum entity = service.create(dto);
        return ResponseEntity.ok(ForumMapper.toCategoryForumResponse(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryForumResponse> update(@PathVariable String id, @Valid @RequestBody CategoryForumRequest dto) {
        if (!isAdmin()) return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        CategoryForum entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toCategoryForumResponse(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        if (!isAdmin()) return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        if (service.findById(new ObjectId(id)) == null) return ResponseEntity.notFound().build();
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
