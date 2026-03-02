package esprit_market.controller.forumController;

import esprit_market.dto.forum.MessageRequest;
import esprit_market.dto.forum.MessageResponse;
import esprit_market.entity.forum.Message;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.MessageService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService service;

    @GetMapping
    public List<MessageResponse> getAll() {
        return service.findAll().stream().map(ForumMapper::toMessageResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MessageResponse> findById(@PathVariable String id) {
        Message entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toMessageResponse(entity));
    }

    @PostMapping
    public ResponseEntity<MessageResponse> create(@RequestBody MessageRequest dto) {
        Message entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toMessageResponse(entity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MessageResponse> update(@PathVariable String id, @RequestBody MessageRequest dto) {
        Message entity = service.update(new ObjectId(id), dto);
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toMessageResponse(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        if (service.findById(new ObjectId(id)) == null) return ResponseEntity.notFound().build();
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
