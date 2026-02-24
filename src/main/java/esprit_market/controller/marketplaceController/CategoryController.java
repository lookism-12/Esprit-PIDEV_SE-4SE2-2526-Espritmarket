package esprit_market.controller.marketplaceController;

import esprit_market.entity.marketplace.Category;
import esprit_market.service.marketplaceService.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "Category management APIs")
public class CategoryController {
    private final CategoryService service;

    @GetMapping
    @Operation(summary = "Get all categories")
    public List<Category> findAll() {
        return service.findAll();
    }

    @PostMapping
    @Operation(summary = "Create a new category")
    public Category create(@RequestBody Category category) {
        return service.create(category);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID")
    public Category findById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing category")
    public Category update(@PathVariable ObjectId id, @RequestBody Category category) {
        return service.update(id, category);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a category")
    public void deleteById(@PathVariable ObjectId id) {
        service.deleteById(id);
    }
}
