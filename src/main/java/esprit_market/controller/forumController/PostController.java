package esprit_market.controller.forumController;

import esprit_market.entity.forum.Post;
import esprit_market.service.forumService.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService service;

    @GetMapping
    public List<Post> getAll() { return service.findAll(); }
}
