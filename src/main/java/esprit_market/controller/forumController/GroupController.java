package esprit_market.controller.forumController;

import esprit_market.dto.forum.*;
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
    public List<GroupDto> getAll() {
        return service.findAll().stream().map(ForumMapper::toGroupDto).collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDto> findById(@PathVariable String id) {
        Group entity = service.findById(new ObjectId(id));
        if (entity == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ForumMapper.toGroupDto(entity));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateGroupDto dto) {
        try {
            Group entity = service.create(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(ForumMapper.toGroupDto(entity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody UpdateGroupDto dto) {
        try {
            Group entity = service.update(new ObjectId(id), dto);
            if (entity == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(ForumMapper.toGroupDto(entity));
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
