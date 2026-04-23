package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ProductReviewDTO;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductReview;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ProductReviewRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.userService.TrustService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing product reviews
 * Integrates with Trust & Reputation System
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductReviewService {
    
    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final OrderItemRepository orderItemRepository;
    private final TrustService trustService;
    
    /**
     * Create a new product review
     */
    @Transactional
    public ProductReviewDTO createReview(ProductReviewDTO dto) {
        // Validate customer hasn't already reviewed this order item
        ObjectId customerId = new ObjectId(dto.getCustomerId());
        ObjectId orderItemId = new ObjectId(dto.getOrderItemId());
        
        if (reviewRepository.existsByCustomerIdAndOrderItemId(customerId, orderItemId)) {
            throw new IllegalStateException("You have already reviewed this product");
        }
        
        // Validate order item exists and belongs to customer
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Order item not found"));
        
        // Get product and shop info
        ObjectId productId = new ObjectId(dto.getProductId());
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        
        Shop shop = shopRepository.findById(product.getShopId())
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        
        // Create review
        ProductReview review = ProductReview.builder()
                .productId(productId)
                .shopId(shop.getId())
                .sellerId(shop.getOwnerId())
                .customerId(customerId)
                .orderItemId(orderItemId)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .createdAt(LocalDateTime.now())
                .verified(true)
                .approved(true)
                .build();
        
        ProductReview saved = reviewRepository.save(review);
        
        // ✅ Trigger trust score update
        trustService.onProductReviewed(saved.getId());
        
        log.info("Review created for product {} by customer {}, rating: {}", 
                productId, customerId, dto.getRating());
        
        return toDTO(saved);
    }
    
    /**
     * Get all reviews for a product
     */
    public List<ProductReviewDTO> getProductReviews(String productId) {
        ObjectId id = new ObjectId(productId);
        return reviewRepository.findByProductId(id).stream()
                .filter(ProductReview::isApproved)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all reviews for a seller
     */
    public List<ProductReviewDTO> getSellerReviews(String sellerId) {
        ObjectId id = new ObjectId(sellerId);
        return reviewRepository.findBySellerId(id).stream()
                .filter(ProductReview::isApproved)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert entity to DTO
     */
    private ProductReviewDTO toDTO(ProductReview review) {
        ProductReviewDTO dto = new ProductReviewDTO();
        dto.setId(review.getId().toHexString());
        dto.setProductId(review.getProductId().toHexString());
        dto.setShopId(review.getShopId().toHexString());
        dto.setSellerId(review.getSellerId().toHexString());
        dto.setCustomerId(review.getCustomerId().toHexString());
        dto.setOrderItemId(review.getOrderItemId().toHexString());
        dto.setRating(review.getRating());
        dto.setComment(review.getComment());
        dto.setCreatedAt(review.getCreatedAt());
        dto.setVerified(review.isVerified());
        dto.setApproved(review.isApproved());
        
        // Enrich with product name
        productRepository.findById(review.getProductId()).ifPresent(product -> {
            dto.setProductName(product.getName());
        });
        
        // Enrich with customer name
        userRepository.findById(review.getCustomerId()).ifPresent(user -> {
            dto.setCustomerName(user.getFirstName() + " " + user.getLastName());
        });
        
        return dto;
    }
}
