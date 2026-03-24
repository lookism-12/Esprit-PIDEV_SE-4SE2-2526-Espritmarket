package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ProductImageDTO;
import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductImage;
import esprit_market.service.marketplaceService.IProductService;
import esprit_market.service.marketplaceService.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product", description = "Product management APIs")
public class ProductController {
    private final IProductService service;

    @GetMapping
    @Operation(summary = "Get all products")
    public List<ProductResponseDTO> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ProductResponseDTO getById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Create a new product (PROVIDER only)")
    public ProductResponseDTO create(@RequestBody ProductRequestDTO dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Update an existing product (PROVIDER only)")
    public ProductResponseDTO update(@PathVariable ObjectId id, @RequestBody ProductRequestDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Delete a product (PROVIDER only)")
    public void delete(@PathVariable ObjectId id) {
        service.deleteById(id);
    }

    // --- Product Image CRUD (Nested) ---

    @GetMapping("/{id}/images")
    @Operation(summary = "Get all images of a product")
    public List<ProductImageDTO> getImages(@PathVariable ObjectId id) {
        ProductResponseDTO dto = service.findById(id);
        return dto.getImages() != null ? dto.getImages() : new ArrayList<>();
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Add an image to a product (PROVIDER only)")
    public ProductResponseDTO addImage(@PathVariable ObjectId id,
            @RequestBody ProductImageDTO imageDto) {
        // Use the package-private helper on the concrete service to manipulate entity
        // directly
        ProductService productService = (ProductService) service;
        Product p = productService.findEntityById(id);
        if (p.getImages() == null)
            p.setImages(new ArrayList<>());
        p.getImages().add(new ProductImage(imageDto.getUrl(), imageDto.getAltText()));
        return productService.saveAndMap(p);
    }

    @DeleteMapping("/{id}/images")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Remove an image from a product by URL (PROVIDER only)")
    public ProductResponseDTO removeImage(@PathVariable ObjectId id, @RequestParam String imageUrl) {
        ProductService productService = (ProductService) service;
        Product p = productService.findEntityById(id);
        if (p.getImages() != null) {
            p.getImages().removeIf(img -> img.getUrl().equals(imageUrl));
        }
        return productService.saveAndMap(p);
    }
}
