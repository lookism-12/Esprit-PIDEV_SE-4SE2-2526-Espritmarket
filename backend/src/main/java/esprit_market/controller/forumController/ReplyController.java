package esprit_market.controller.forumController;

import esprit_market.dto.forum.ReplyRequest;
import esprit_market.dto.forum.ReplyResponse;
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
    public ResponseEntity<ReplyResponse> create(@RequestBody ReplyRequest dto) {
        Reply entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toReplyResponse(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReplyResponse> update(@PathVariable String id, @RequestBody ReplyRequest dto) {
        Reply entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toReplyResponse(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        if (service.findById(new ObjectId(id)) == null) return ResponseEntity.notFound().build();
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
