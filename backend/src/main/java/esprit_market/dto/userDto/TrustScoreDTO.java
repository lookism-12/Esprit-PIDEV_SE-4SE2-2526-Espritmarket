package esprit_market.dto.userDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for seller trust score information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrustScoreDTO {
    
    private String sellerId;
    private String sellerName;
    private double trustScore;
    private String trustBadge;
    private String badgeColor;
    
    // Statistics breakdown
    private int totalSales;
    private int approvedProducts;
    private int rejectedProducts;
    private double averageRating;
    private int totalRatings;
    
    // Component scores (for transparency)
    private double ratingComponent;
    private double salesComponent;
    private double approvalComponent;
    private double rejectionPenalty;
}
