package esprit_market.controller;

import esprit_market.entity.Comment;
import esprit_market.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService service;

    @GetMapping
    public List<Comment> findAll() { return service.findAll(); }

    @PostMapping
    public Comment save(@RequestBody Comment comment) { return service.save(comment); }

    @GetMapping("/{id}")
    public Comment findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
