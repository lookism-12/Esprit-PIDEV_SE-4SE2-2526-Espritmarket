package esprit_market.controller.forumController;

import esprit_market.dto.forum.*;
import esprit_market.entity.forum.CategoryForum;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.CategoryForumService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/categories")
@RequiredArgsConstructor
public class CategoryForumController {
    private final CategoryForumService service;

    @GetMapping
    public List<CategoryForumDto> findAll() {
        return service.findAll().stream().map(ForumMapper::toCategoryForumDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryForumDto> findById(@PathVariable String id) {
        CategoryForum entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toCategoryForumDto(entity));
    }

    @PostMapping
    public CategoryForumDto create(@RequestBody CreateCategoryForumDto dto) {
        CategoryForum entity = service.create(dto);
        return ForumMapper.toCategoryForumDto(entity);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryForumDto> update(@PathVariable String id, @RequestBody UpdateCategoryForumDto dto) {
        CategoryForum entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toCategoryForumDto(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        if (service.findById(new ObjectId(id)) == null) return ResponseEntity.notFound().build();
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
