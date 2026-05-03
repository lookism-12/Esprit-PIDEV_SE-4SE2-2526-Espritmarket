package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.FavorisRequestDTO;
import esprit_market.dto.marketplace.FavorisResponseDTO;
import esprit_market.service.marketplaceService.IFavorisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/favoris")
@RequiredArgsConstructor
@Tag(name = "Favoris", description = "Endpoints for managing user favorites")
public class FavorisController {
    private final IFavorisService service;

    @GetMapping
    @Operation(summary = "Get all favorites")
    public List<FavorisResponseDTO> findAll() {
        return service.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT', 'SELLER', 'PROVIDER', 'ADMIN', 'PASSENGER', 'DRIVER')")
    @Operation(summary = "Add a new favorite")
    public FavorisResponseDTO create(@RequestBody FavorisRequestDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get favorite by ID")
    public FavorisResponseDTO findById(@PathVariable String id) {
        return service.findById(new ObjectId(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all favorites for a specific user")
    public List<FavorisResponseDTO> getByUserId(@PathVariable String userId) {
        return service.getByUserId(new ObjectId(userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'SELLER', 'PROVIDER', 'ADMIN', 'PASSENGER', 'DRIVER')")
    @Operation(summary = "Update an existing favorite")
    public FavorisResponseDTO update(@PathVariable String id, @RequestBody FavorisRequestDTO dto) {
        return service.update(new ObjectId(id), dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'SELLER', 'PROVIDER', 'ADMIN', 'PASSENGER', 'DRIVER')")
    @Operation(summary = "Remove a favorite")
    public void delete(@PathVariable String id) {
        service.delete(new ObjectId(id));
    }

    @PostMapping("/toggle/product/{productId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'SELLER', 'PROVIDER', 'ADMIN', 'PASSENGER', 'DRIVER')")
    @Operation(summary = "Toggle favorite for a product (add if not exists, remove if exists)")
    public FavorisResponseDTO toggleProductFavorite(@PathVariable String productId) {
        return service.toggleProductFavorite(new ObjectId(productId));
    }

    @PostMapping("/toggle/service/{serviceId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'SELLER', 'PROVIDER', 'ADMIN', 'PASSENGER', 'DRIVER')")
    @Operation(summary = "Toggle favorite for a service (add if not exists, remove if exists)")
    public FavorisResponseDTO toggleServiceFavorite(@PathVariable String serviceId) {
        return service.toggleServiceFavorite(new ObjectId(serviceId));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('CLIENT', 'SELLER', 'PROVIDER', 'ADMIN', 'PASSENGER', 'DRIVER')")
    @Operation(summary = "Get favorites for the current authenticated user")
    public List<FavorisResponseDTO> getMyFavorites() {
        return service.getMyFavorites();
    }

    @GetMapping("/check/product/{productId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'SELLER', 'PROVIDER', 'ADMIN', 'PASSENGER', 'DRIVER')")
    @Operation(summary = "Check if current user has favorited a product")
    public boolean isProductFavorited(@PathVariable String productId) {
        return service.isProductFavorited(new ObjectId(productId));
    }

    @GetMapping("/check/service/{serviceId}")
    @PreAuthorize("hasAnyRole('CLIENT', 'SELLER', 'PROVIDER', 'ADMIN', 'PASSENGER', 'DRIVER')")
    @Operation(summary = "Check if current user has favorited a service")
    public boolean isServiceFavorited(@PathVariable String serviceId) {
        return service.isServiceFavorited(new ObjectId(serviceId));
    }
}
