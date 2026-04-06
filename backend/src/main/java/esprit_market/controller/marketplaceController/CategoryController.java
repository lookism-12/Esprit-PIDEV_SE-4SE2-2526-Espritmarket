package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.CategoryRequestDTO;
import esprit_market.dto.marketplace.CategoryResponseDTO;
import esprit_market.service.marketplaceService.ICategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "Category management APIs")
public class CategoryController {
    private final ICategoryService service;

    @GetMapping
    @Operation(summary = "Get all categories")
    public List<CategoryResponseDTO> findAll() {
        return service.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new category")
    public CategoryResponseDTO create(@RequestBody CategoryRequestDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category by ID")
    public CategoryResponseDTO findById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing category")
    public CategoryResponseDTO update(@PathVariable ObjectId id, @RequestBody CategoryRequestDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a category")
    public void deleteById(@PathVariable ObjectId id) {
        service.deleteById(id);
    }
}
