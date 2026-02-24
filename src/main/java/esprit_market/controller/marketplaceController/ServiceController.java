package esprit_market.controller.marketplaceController;

import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.service.marketplaceService.ServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@Tag(name = "Service", description = "Service management APIs")
public class ServiceController {
    private final ServiceService service;

    @GetMapping
    @Operation(summary = "Get all services")
    public List<ServiceEntity> findAll() {
        return service.findAll();
    }

    @PostMapping
    @Operation(summary = "Create a new service")
    public ServiceEntity create(@RequestBody ServiceEntity s) {
        return service.create(s);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service by ID")
    public ServiceEntity findById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing service")
    public ServiceEntity update(@PathVariable ObjectId id, @RequestBody ServiceEntity s) {
        return service.update(id, s);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a service")
    public void deleteById(@PathVariable ObjectId id) {
        service.deleteById(id);
    }
}
