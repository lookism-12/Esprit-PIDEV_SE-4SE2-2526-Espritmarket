package esprit_market.controller.marketplaceController;

import esprit_market.entity.marketplace.Favoris;
import esprit_market.service.marketplaceService.IFavorisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
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
    public List<Favoris> findAll() {
        return service.findAll();
    }

    @PostMapping
    @Operation(summary = "Add a new favorite")
    public Favoris create(@RequestBody Favoris favoris) {
        return service.create(favoris);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get favorite by ID")
    public Favoris findById(@PathVariable String id) {
        return service.findById(new ObjectId(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all favorites for a specific user")
    public List<Favoris> getByUserId(@PathVariable String userId) {
        return service.getByUserId(new ObjectId(userId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing favorite")
    public Favoris update(@PathVariable String id, @RequestBody Favoris favoris) {
        return service.update(new ObjectId(id), favoris);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a favorite")
    public void delete(@PathVariable String id) {
        service.delete(new ObjectId(id));
    }
}
