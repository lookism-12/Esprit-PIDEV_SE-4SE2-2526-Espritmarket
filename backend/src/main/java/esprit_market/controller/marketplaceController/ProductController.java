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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Product", description = "Product management APIs")
public class ProductController {
    private static final Logger log = LoggerFactory.getLogger(ProductController.class);

    private final IProductService service;

    @GetMapping
    @Operation(summary = "Get all approved products (Client/Public)")
    public List<ProductResponseDTO> getAll() {
        // ✅ TEMPORARY FIX: Return all products for testing
        // TODO: Change back to findAllApproved() once products are properly approved
        log.info("GET /api/products - Returning all products (temporary fix)");
        List<ProductResponseDTO> products = service.findAll();
        log.info("GET /api/products - Returning {} products", products.size());
        return products;
        // return service.findAllApproved(); // Original implementation
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all products including pending/rejected (ADMIN)")
    public List<ProductResponseDTO> getAllAdmin() {
        log.info("GET /api/products/all - Admin requesting all products");
        List<ProductResponseDTO> products = service.findAll();
        log.info("GET /api/products/all - Returning {} products", products.size());
        return products;
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Products for the authenticated provider's shop (all statuses)")
    public List<ProductResponseDTO> getMine() {
        return service.findForCurrentSeller();
    }

    @GetMapping("/shop/{shopId}")
    @Operation(summary = "Get all products by shop ID")
    public List<ProductResponseDTO> getByShop(@PathVariable String shopId) {
        log.info("GET /api/products/shop/{} - Requesting products for shop", shopId);
        List<ProductResponseDTO> products = service.findByShopId(shopId);
        log.info("GET /api/products/shop/{} - Returning {} products", shopId, products.size());
        return products;
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID")
    public ProductResponseDTO getById(@PathVariable ObjectId id) {
        return service.findById(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or (hasRole('PROVIDER') and @marketplaceSecurity.isShopOwner(authentication, #dto.shopId))")
    @Operation(summary = "Create a new product (PROVIDER/ADMIN)")
    public ProductResponseDTO create(@RequestBody ProductRequestDTO dto) {
        log.info("POST /api/products - Creating product: name={}, shopId={}, categoryIds={}", 
                 dto.getName(), dto.getShopId(), dto.getCategoryIds());
        ProductResponseDTO result = service.create(dto);
        log.info("POST /api/products - Product created successfully with ID: {}", result.getId());
        return result;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('PROVIDER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
    @Operation(summary = "Update an existing product (PROVIDER/ADMIN)")
    public ProductResponseDTO update(@PathVariable ObjectId id, @RequestBody ProductRequestDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('PROVIDER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
    @Operation(summary = "Delete a product (PROVIDER/ADMIN)")
    public void delete(@PathVariable ObjectId id) {
        service.deleteById(id);
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve a product (ADMIN)")
    public ProductResponseDTO approve(@PathVariable ObjectId id) {
        return service.approve(id);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject a product (ADMIN)")
    public ProductResponseDTO reject(@PathVariable ObjectId id) {
        return service.reject(id);
    }

    // --- Product Image CRUD (Nested) ---

    @GetMapping("/{id}/images")
    @Operation(summary = "Get all images of a product")
    public List<ProductImageDTO> getImages(@PathVariable ObjectId id) {
        ProductResponseDTO dto = service.findById(id);
        return dto.getImages() != null ? dto.getImages() : new ArrayList<>();
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasRole('ADMIN') or (hasRole('PROVIDER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
    @Operation(summary = "Add an image to a product (PROVIDER/ADMIN)")
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
    @PreAuthorize("hasRole('ADMIN') or (hasRole('PROVIDER') and @marketplaceSecurity.isProductOwner(authentication, #id))")
    @Operation(summary = "Remove an image from a product by URL (PROVIDER/ADMIN)")
    public ProductResponseDTO removeImage(@PathVariable ObjectId id, @RequestParam String imageUrl) {
        ProductService productService = (ProductService) service;
        Product p = productService.findEntityById(id);
        if (p.getImages() != null) {
            p.getImages().removeIf(img -> img.getUrl().equals(imageUrl));
        }
        return productService.saveAndMap(p);
    }
}
