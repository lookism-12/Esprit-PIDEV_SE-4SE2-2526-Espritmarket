package esprit_market.controller.forumController;

import esprit_market.dto.forum.*;
import esprit_market.entity.forum.Reply;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.ReplyService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/replies")
@RequiredArgsConstructor
public class ReplyController {
    private final ReplyService service;

    @GetMapping
    public List<ReplyDto> getAll() {
        return service.findAll().stream().map(ForumMapper::toReplyDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReplyDto> findById(@PathVariable String id) {
        Reply entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toReplyDto(entity));
    }

    @PostMapping
    public ResponseEntity<ReplyDto> create(@RequestBody CreateReplyDto dto) {
        Reply entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toReplyDto(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReplyDto> update(@PathVariable String id, @RequestBody UpdateReplyDto dto) {
        Reply entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toReplyDto(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        if (service.findById(new ObjectId(id)) == null) return ResponseEntity.notFound().build();
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
