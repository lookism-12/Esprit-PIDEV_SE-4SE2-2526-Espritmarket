package esprit_market.controller.forumController;

import esprit_market.entity.forum.Reply;
import esprit_market.service.forumService.ReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/replies")
@RequiredArgsConstructor
public class ReplyController {
    private final ReplyService service;

    @GetMapping
    public List<Reply> getAll() {
        return service.findAll();
    }
}