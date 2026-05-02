package esprit_market.dto.cartDto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO sent to the Cart ML Python service (port 8002)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartMLRequest {

    @JsonProperty("product_id")
    private String productId;

    @JsonProperty("cost_price")
    private double costPrice;

    @JsonProperty("unit_price")
    private double unitPrice;

    @JsonProperty("stock")
    private int stock;

    @JsonProperty("sales_volume")
    private double salesVolume;

    @JsonProperty("return_rate")
    private double returnRate;

    @JsonProperty("profit")
    private double profit;

    @JsonProperty("demand_score")
    private double demandScore;

    @JsonProperty("price_competitiveness_score")
    private double priceCompetitivenessScore;

    @JsonProperty("cart_abandonment_rate")
    private double cartAbandonmentRate;

    @JsonProperty("loyalty_score")
    private double loyaltyScore;

    @JsonProperty("shop_performance_index")
    private double shopPerformanceIndex;

    @JsonProperty("category")
    private String category;
}
