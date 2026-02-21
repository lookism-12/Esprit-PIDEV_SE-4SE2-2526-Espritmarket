package esprit_market.controller;

import esprit_market.entity.Delivery;
import esprit_market.service.DeliveryService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {
    private final DeliveryService service;

    @GetMapping
    public List<Delivery> findAll() { return service.findAll(); }

    @PostMapping
    public Delivery save(@RequestBody Delivery delivery) { return service.save(delivery); }

    @GetMapping("/{id}")
    public Delivery findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
