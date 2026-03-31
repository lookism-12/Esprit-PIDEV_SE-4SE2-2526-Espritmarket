package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.service.marketplaceService.IServiceService;
import esprit_market.service.userService.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@Tag(name = "Service", description = "Service management APIs")
public class ServiceController {
    private final IServiceService service;
    private final IUserService userService;

    private String resolveUserId(Authentication authentication) {
        return userService.resolveUserId(authentication.getName()).toHexString();
    }

    @GetMapping
    @Operation(summary = "Get all services")
    public List<ServiceResponseDTO> findAll() {
        return service.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Create a new service (PROVIDER only)")
    public ServiceResponseDTO create(@RequestBody ServiceRequestDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service by ID")
    public ServiceResponseDTO findById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Update an existing service (PROVIDER only)")
    public ServiceResponseDTO update(@PathVariable ObjectId id, @RequestBody ServiceRequestDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Delete a service (PROVIDER only)")
    public void deleteById(@PathVariable ObjectId id) {
        service.deleteById(id);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Get my services (for provider profile)")
    public List<ServiceResponseDTO> getMyServices(Authentication authentication) {
        String ownerId = resolveUserId(authentication);
        return service.findByOwnerId(ownerId);
    }
}
