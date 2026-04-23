package esprit_market.entity.marketplace;

import lombok.*;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Product Review entity for customer feedback
 * Used to calculate seller's average rating and trust score
 */
@Document(collection = "product_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReview {
    
    @Id
    private ObjectId id;
    
    /**
     * Product being reviewed
     */
    private ObjectId productId;
    
    /**
     * Shop that owns the product
     */
    private ObjectId shopId;
    
    /**
     * Seller (shop owner) being reviewed
     */
    private ObjectId sellerId;
    
    /**
     * Customer who wrote the review
     */
    private ObjectId customerId;
    
    /**
     * Order item this review is for (ensures verified purchase)
     */
    private ObjectId orderItemId;
    
    /**
     * Rating: 1-5 stars
     */
    private int rating;
    
    /**
     * Optional review text
     */
    private String comment;
    
    /**
     * Review creation timestamp
     */
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    
    /**
     * Whether review is verified (from actual purchase)
     */
    @Builder.Default
    private boolean verified = true;
    
    /**
     * Admin moderation flag
     */
    @Builder.Default
    private boolean approved = true;
}
