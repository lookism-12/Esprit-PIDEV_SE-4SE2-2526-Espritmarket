package esprit_market.controller;

import esprit_market.entity.ServiceEntity;
import esprit_market.service.ServiceService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class ServiceController {
    private final ServiceService service;

    @GetMapping
    public List<ServiceEntity> findAll() { return service.findAll(); }

    @PostMapping
    public ServiceEntity save(@RequestBody ServiceEntity s) { return service.save(s); }

    @GetMapping("/{id}")
    public ServiceEntity findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
