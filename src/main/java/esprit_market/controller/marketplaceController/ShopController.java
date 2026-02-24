package esprit_market.controller.marketplaceController;

import esprit_market.entity.marketplace.Shop;
import esprit_market.service.marketplaceService.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
@Tag(name = "Shop", description = "Shop management APIs")
public class ShopController {
    private final ShopService service;

    @GetMapping
    @Operation(summary = "Get all shops")
    public List<Shop> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get shop by ID")
    public Shop getById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PostMapping
    @Operation(summary = "Create a new shop")
    public Shop create(@RequestBody Shop shop) {
        return service.create(shop);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing shop")
    public Shop update(@PathVariable ObjectId id, @RequestBody Shop shop) {
        return service.update(id, shop);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a shop")
    public void delete(@PathVariable ObjectId id) {
        service.deleteById(id);
    }
}
