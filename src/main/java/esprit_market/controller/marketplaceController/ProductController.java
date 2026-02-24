package esprit_market.controller.marketplaceController;

import esprit_market.entity.marketplace.Product;
import esprit_market.service.marketplaceService.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product", description = "Product management APIs")
public class ProductController {
    private final ProductService service;

    @GetMapping
    @Operation(summary = "Get all products")
    public List<Product> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public Product getById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PostMapping
    @Operation(summary = "Create a new product")
    public Product create(@RequestBody Product product) {
        return service.create(product);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing product")
    public Product update(@PathVariable ObjectId id, @RequestBody Product product) {
        return service.update(id, product);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a product")
    public void delete(@PathVariable ObjectId id) {
        service.deleteById(id);
    }

    // --- Product Image CRUD (Nested) ---

    @GetMapping("/{id}/images")
    @Operation(summary = "Get all images of a product")
    public List<esprit_market.entity.marketplace.ProductImage> getImages(@PathVariable ObjectId id) {
        return service.findById(id).getImages();
    }

    @PostMapping("/{id}/images")
    @Operation(summary = "Add an image to a product")
    public Product addImage(@PathVariable ObjectId id,
            @RequestBody esprit_market.entity.marketplace.ProductImage image) {
        Product p = service.findById(id);
        if (p.getImages() == null)
            p.setImages(new java.util.ArrayList<>());
        p.getImages().add(image);
        return service.update(id, p);
    }

    @DeleteMapping("/{id}/images")
    @Operation(summary = "Remove an image from a product by URL")
    public Product removeImage(@PathVariable ObjectId id, @RequestParam String imageUrl) {
        Product p = service.findById(id);
        if (p.getImages() != null) {
            p.getImages().removeIf(img -> img.getUrl().equals(imageUrl));
        }
        return service.update(id, p);
    }
}
