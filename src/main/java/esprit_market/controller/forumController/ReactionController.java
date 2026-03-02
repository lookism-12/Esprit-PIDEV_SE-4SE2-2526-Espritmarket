package esprit_market.controller.forumController;

import esprit_market.dto.forum.ReactionRequest;
import esprit_market.dto.forum.ReactionResponse;
import esprit_market.entity.forum.Reaction;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.ReactionService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/reactions")
@RequiredArgsConstructor
public class ReactionController {
    private final ReactionService service;

    @GetMapping
    public List<ReactionResponse> getAll() {
        return service.findAll().stream().map(ForumMapper::toReactionResponse).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReactionResponse> findById(@PathVariable String id) {
        Reaction entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toReactionResponse(entity));
    }

    @PostMapping
    public ResponseEntity<ReactionResponse> create(@RequestBody ReactionRequest dto) {
        Reaction entity = service.create(dto);
        if (entity == null) return ResponseEntity.badRequest().build();
        return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toReactionResponse(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        if (service.findById(new ObjectId(id)) == null) return ResponseEntity.notFound().build();
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
