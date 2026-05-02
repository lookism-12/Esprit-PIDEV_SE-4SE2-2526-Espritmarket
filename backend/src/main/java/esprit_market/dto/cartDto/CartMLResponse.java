package esprit_market.dto.cartDto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO received from the Cart ML Python service (port 8002)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartMLResponse {

    @JsonProperty("product_id")
    private String productId;

    /** YES or NO */
    @JsonProperty("promotion_suggestion")
    private String promotionSuggestion;

    /** INCREASE, DECREASE, or STABLE */
    @JsonProperty("price_adjustment")
    private String priceAdjustment;

    @JsonProperty("confidence_promo")
    private double confidencePromo;

    @JsonProperty("confidence_price")
    private double confidencePrice;

    @JsonProperty("recommended_price")
    private Double recommendedPrice;

    @JsonProperty("expected_impact")
    private String expectedImpact;

    @JsonProperty("model_used")
    private String modelUsed;

    // ── Convenience helpers ──────────────────────────────────

    public boolean shouldApplyPromotion() {
        return "YES".equalsIgnoreCase(promotionSuggestion);
    }

    public boolean shouldIncreasePrice() {
        return "INCREASE".equalsIgnoreCase(priceAdjustment);
    }

    public boolean shouldDecreasePrice() {
        return "DECREASE".equalsIgnoreCase(priceAdjustment);
    }
}
