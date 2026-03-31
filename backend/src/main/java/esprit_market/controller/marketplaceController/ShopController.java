package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.service.marketplaceService.IShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
@Tag(name = "Shop", description = "Shop management APIs")
public class ShopController {
    private final IShopService service;

    @GetMapping
    @Operation(summary = "Get all shops")
    public List<ShopResponseDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('SELLER', 'PROVIDER')")
    @Operation(summary = "Get the authenticated seller's shop")
    public ShopResponseDTO getMyShop() {
        return service.findMyShop();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get shop by ID")
    public ShopResponseDTO getById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER', 'PROVIDER')")
    @Operation(summary = "Create a new shop")
    public ShopResponseDTO create(@RequestBody ShopRequestDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isShopOwnerByObjectId(authentication, #id))")
    @Operation(summary = "Update an existing shop")
    public ShopResponseDTO update(@PathVariable ObjectId id, @RequestBody ShopRequestDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or ((hasAnyRole('SELLER', 'PROVIDER')) and @marketplaceSecurity.isShopOwnerByObjectId(authentication, #id))")
    @Operation(summary = "Delete a shop")
    public void delete(@PathVariable ObjectId id) {
        service.deleteById(id);
    }
}
