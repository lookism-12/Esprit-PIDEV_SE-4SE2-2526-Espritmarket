package esprit_market.controller.forumController;

import esprit_market.dto.forum.GroupRequest;
import esprit_market.dto.forum.GroupResponse;
import esprit_market.entity.forum.Group;
import esprit_market.mappers.ForumMapper;
import esprit_market.service.forumService.GroupService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/forum/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService service;

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
    public ResponseEntity<?> create(@RequestBody GroupRequest dto) {
        try {
            Group entity = service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toGroupResponse(entity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody GroupRequest dto) {
        try {
            Group entity = service.update(new ObjectId(id), dto);
            if (entity == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(ForumMapper.toGroupResponse(entity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteById(@PathVariable String id) {
        if (service.findById(new ObjectId(id)) == null) return ResponseEntity.notFound().build();
        service.deleteById(new ObjectId(id));
        return ResponseEntity.noContent().build();
    }
}
