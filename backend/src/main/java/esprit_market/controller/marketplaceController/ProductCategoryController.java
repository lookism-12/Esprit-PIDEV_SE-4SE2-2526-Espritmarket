package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ProductCategoryRequestDTO;
import esprit_market.dto.marketplace.ProductCategoryResponseDTO;
import esprit_market.service.marketplaceService.IProductCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product-categories")
@RequiredArgsConstructor
@Tag(name = "ProductCategory", description = "Product-Category linkage APIs")
public class ProductCategoryController {
    private final IProductCategoryService service;

    @GetMapping
    @Operation(summary = "Get all linkage records")
    public List<ProductCategoryResponseDTO> getAll() {
        return service.findAll();
    }

    @PostMapping
    @Operation(summary = "Create a new linkage")
    public ProductCategoryResponseDTO create(@RequestBody ProductCategoryRequestDTO dto) {
        return service.create(dto);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get linkage by ID")
    public ProductCategoryResponseDTO getById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a linkage")
    public void delete(@PathVariable ObjectId id) {
        service.deleteById(id);
    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get linkages by Product ID")
    public List<ProductCategoryResponseDTO> getByProduct(@PathVariable ObjectId productId) {
        return service.findByProductId(productId);
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Get linkages by Category ID")
    public List<ProductCategoryResponseDTO> getByCategory(@PathVariable ObjectId categoryId) {
        return service.findByCategoryId(categoryId);
    }
}
