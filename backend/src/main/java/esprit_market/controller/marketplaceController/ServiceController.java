package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import esprit_market.service.marketplaceService.IServiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @GetMapping("/mine")
    @PreAuthorize("hasAnyRole('SELLER', 'PROVIDER')")
    @Operation(summary = "Services for the authenticated seller's shop (all statuses)")
    public List<ServiceResponseDTO> getMine() {
        return service.findForCurrentSeller();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or (hasAnyRole('SELLER', 'PROVIDER') and (#dto.shopId == null or #dto.shopId == '' or @marketplaceSecurity.isShopOwner(authentication, #dto.shopId)))")
    @Operation(summary = "Create a new service (SELLER/PROVIDER/ADMIN)")
    public ServiceResponseDTO create(@RequestBody ServiceRequestDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service by ID")
    public ServiceResponseDTO findById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isServiceOwner(authentication, #id))")
    @Operation(summary = "Update an existing service (SELLER/PROVIDER/ADMIN)")
    public ServiceResponseDTO update(@PathVariable ObjectId id, @RequestBody ServiceRequestDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isServiceOwner(authentication, #id))")
    @Operation(summary = "Delete a service (SELLER/PROVIDER/ADMIN)")
    public void deleteById(@PathVariable ObjectId id) {
        service.deleteById(id);
    }
}
