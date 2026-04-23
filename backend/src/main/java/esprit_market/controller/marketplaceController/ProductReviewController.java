package esprit_market.controller.marketplaceController;

import esprit_market.dto.marketplace.ProductReviewDTO;
import esprit_market.service.marketplaceService.ProductReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Product Reviews
 */
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Product Reviews", description = "Product review and rating management")
public class ProductReviewController {
    
    private final ProductReviewService reviewService;
    
    /**
     * Create a new product review
     */
    @PostMapping
    @Operation(summary = "Create review", description = "Create a new product review (verified purchase)")
    public ResponseEntity<ProductReviewDTO> createReview(@RequestBody ProductReviewDTO dto) {
        ProductReviewDTO created = reviewService.createReview(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    
    /**
     * Get all reviews for a product
     */
    @GetMapping("/products/{productId}")
    @Operation(summary = "Get product reviews", description = "Get all approved reviews for a product")
    public ResponseEntity<List<ProductReviewDTO>> getProductReviews(@PathVariable String productId) {
        List<ProductReviewDTO> reviews = reviewService.getProductReviews(productId);
        return ResponseEntity.ok(reviews);
    }
    
    /**
     * Get all reviews for a seller
     */
    @GetMapping("/sellers/{sellerId}")
    @Operation(summary = "Get seller reviews", description = "Get all approved reviews for a seller")
    public ResponseEntity<List<ProductReviewDTO>> getSellerReviews(@PathVariable String sellerId) {
        List<ProductReviewDTO> reviews = reviewService.getSellerReviews(sellerId);
        return ResponseEntity.ok(reviews);
    }
}
