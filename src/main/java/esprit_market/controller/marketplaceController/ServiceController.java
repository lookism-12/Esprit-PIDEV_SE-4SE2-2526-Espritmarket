package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.service.marketplaceService.IServiceService;
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
    private final IServiceService service;

    @GetMapping
    @Operation(summary = "Get all services")
    public List<ServiceResponseDTO> findAll() {
        return service.findAll();
    }

    @PostMapping
    @Operation(summary = "Create a new service")
    public ServiceResponseDTO create(@RequestBody ServiceRequestDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service by ID")
    public ServiceResponseDTO findById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing service")
    public ServiceResponseDTO update(@PathVariable ObjectId id, @RequestBody ServiceRequestDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a service")
    public void deleteById(@PathVariable ObjectId id) {
        service.deleteById(id);
    }
}
