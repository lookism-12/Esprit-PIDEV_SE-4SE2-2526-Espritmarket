package esprit_market.controller;

import esprit_market.entity.Favoris;
import esprit_market.service.FavorisService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favoris")
@RequiredArgsConstructor
public class FavorisController {
    private final FavorisService service;

    @GetMapping
    public List<Favoris> findAll() { return service.findAll(); }

    @PostMapping
    public Favoris save(@RequestBody Favoris favoris) { return service.save(favoris); }

    @GetMapping("/{id}")
    public Favoris findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
