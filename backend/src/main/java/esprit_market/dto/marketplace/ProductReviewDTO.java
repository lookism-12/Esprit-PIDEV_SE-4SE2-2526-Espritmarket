package esprit_market.dto.marketplace;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for product reviews
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewDTO {
    
    private String id;
    private String productId;
    private String productName;
    private String shopId;
    private String sellerId;
    private String customerId;
    private String customerName;
    private String orderItemId;
    
    private int rating;
    private String comment;
    
    private LocalDateTime createdAt;
    private boolean verified;
    private boolean approved;
}
