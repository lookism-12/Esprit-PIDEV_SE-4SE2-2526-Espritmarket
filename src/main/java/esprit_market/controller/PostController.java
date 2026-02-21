package esprit_market.controller;

import esprit_market.entity.Post;
import esprit_market.service.PostService;
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
