package esprit_market.controller.forumController;

import esprit_market.dto.forum.*;
import esprit_market.entity.forum.Comment;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.CommentService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService service;

    @GetMapping
    public List<CommentDto> findAll() {
        return service.findAll().stream().map(ForumMapper::toCommentDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CommentDto> findById(@PathVariable String id) {
        Comment entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toCommentDto(entity));
    }
   
    @PostMapping
    public ResponseEntity<CommentDto> create(@RequestBody CreateCommentDto dto) {
        Comment entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toCommentDto(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentDto> update(@PathVariable String id, @RequestBody UpdateCommentDto dto) {
        Comment entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toCommentDto(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        if (service.findById(new ObjectId(id)) == null) return ResponseEntity.notFound().build();
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
