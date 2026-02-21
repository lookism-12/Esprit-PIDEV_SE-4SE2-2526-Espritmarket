package esprit_market.controller;

import esprit_market.entity.Reaction;
import esprit_market.service.ReactionService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reactions")
@RequiredArgsConstructor
public class ReactionController {
    private final ReactionService service;

    @GetMapping
    public List<Reaction> findAll() { return service.findAll(); }

    @PostMapping
    public Reaction save(@RequestBody Reaction reaction) { return service.save(reaction); }

    @GetMapping("/{id}")
    public Reaction findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
