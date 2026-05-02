package esprit_market.dto.cartDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Complete ML analytics report for a provider's shop
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProviderMLAnalyticsDTO {

    private String shopId;
    private String shopName;
    private int totalProducts;
    private int analyzedProducts;

    // Summary counts
    private long promoEligibleCount;
    private long priceIncreaseCount;
    private long priceDecreaseCount;
    private long priceStableCount;

    // Per-product predictions
    private List<ProductMLPrediction> predictions;

    // Category-level insights
    private List<CategoryInsight> categoryInsights;

    // Top recommendations
    private List<String> topRecommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductMLPrediction {
        private String productId;
        private String productName;
        private String category;
        private double currentPrice;
        private int stock;
        private int salesVolume;

        // ML outputs
        private String promotionSuggestion;   // YES / NO
        private String priceAdjustment;       // INCREASE / DECREASE / STABLE / HOLD
        private double confidencePromo;
        private double confidencePrice;
        private Double recommendedPrice;
        private String expectedImpact;
        private String modelUsed;

        // Competitive context
        private Double avgCategoryPrice;
        private String pricePosition;         // ABOVE_MARKET / BELOW_MARKET / AT_MARKET
        private int competitorCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryInsight {
        private String category;
        private int productCount;
        private double avgPrice;
        private double avgStock;
        private long promoCount;
        private String dominantPriceAction;
    }
}
