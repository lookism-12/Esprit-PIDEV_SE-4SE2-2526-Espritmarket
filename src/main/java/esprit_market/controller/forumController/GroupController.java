package esprit_market.controller.forumController;

import esprit_market.entity.forum.Group;
import esprit_market.service.forumService.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService service;

    @GetMapping
    public List<Group> getAll() { return service.findAll(); }
}
