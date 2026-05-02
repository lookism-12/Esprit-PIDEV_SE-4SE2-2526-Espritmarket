package esprit_market.service.cartService;

import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.dto.cartDto.CartMLRequest;
import esprit_market.dto.cartDto.CartMLResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service that calls the Cart ML Python API (port 8002)
 * to get promotion suggestions and price adjustments for cart items.
 */
@Service
@Slf4j
public class CartMLService {

    private final WebClient webClient;

    @Value("${app.cart-ml.enabled:true}")
    private boolean enabled;

    @Value("${app.cart-ml.timeout-seconds:10}")
    private int timeoutSeconds;

    public CartMLService(@Qualifier("cartMLWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    // ──────────────────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────────────────

    /**
     * Get ML prediction for a single cart item.
     * Falls back to a safe default if the service is unavailable.
     */
    public CartMLResponse predict(CartItemResponse item) {
        if (!enabled) {
            log.debug("Cart ML service disabled – returning default for product {}", item.getProductId());
            return defaultResponse(item.getProductId());
        }

        CartMLRequest request = buildRequest(item);
        return callPredict(request);
    }

    /**
     * Get ML predictions for all items in the cart (batch call).
     */
    public List<CartMLResponse> predictBatch(List<CartItemResponse> items) {
        if (!enabled || items == null || items.isEmpty()) {
            return items == null ? List.of() :
                    items.stream()
                         .map(i -> defaultResponse(i.getProductId()))
                         .collect(Collectors.toList());
        }

        List<CartMLRequest> requests = items.stream()
                .map(this::buildRequest)
                .collect(Collectors.toList());

        try {
            var body = new java.util.HashMap<String, Object>();
            body.put("products", requests);

            List<CartMLResponse> responses = webClient.post()
                    .uri("/predict/batch")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToFlux(CartMLResponse.class)
                    .collectList()
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();

            log.info("✅ Cart ML batch prediction: {} items", responses != null ? responses.size() : 0);
            return responses != null ? responses : List.of();

        } catch (Exception e) {
            log.warn("⚠️ Cart ML batch prediction failed: {} – using defaults", e.getMessage());
            return items.stream()
                        .map(i -> defaultResponse(i.getProductId()))
                        .collect(Collectors.toList());
        }
    }

    /**
     * Check if the ML service is reachable.
     */
    public boolean isServiceAvailable() {
        try {
            String status = webClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(3))
                    .block();
            return status != null && status.contains("healthy");
        } catch (Exception e) {
            return false;
        }
    }

    // ──────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────

    private CartMLResponse callPredict(CartMLRequest request) {
        try {
            CartMLResponse response = webClient.post()
                    .uri("/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(CartMLResponse.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();

            if (response != null) {
                log.info("🤖 ML prediction for {}: promo={} price={} ({})",
                        request.getProductId(),
                        response.getPromotionSuggestion(),
                        response.getPriceAdjustment(),
                        response.getModelUsed());
            }
            return response != null ? response : defaultResponse(request.getProductId());

        } catch (WebClientResponseException e) {
            log.warn("⚠️ Cart ML HTTP error {}: {}", e.getStatusCode(), e.getMessage());
            return defaultResponse(request.getProductId());
        } catch (Exception e) {
            log.warn("⚠️ Cart ML unavailable: {} – using default", e.getMessage());
            return defaultResponse(request.getProductId());
        }
    }

    /**
     * Map a CartItemResponse to the ML request format.
     * Uses sensible defaults for fields not stored on CartItem.
     */
    private CartMLRequest buildRequest(CartItemResponse item) {
        double unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : 0.0;
        int    stock     = item.getStock()     != null ? item.getStock()     : 0;
        int    qty       = item.getQuantity()  != null ? item.getQuantity()  : 1;

        return CartMLRequest.builder()
                .productId(item.getProductId())
                .costPrice(unitPrice * 0.6)          // estimate: 60% of selling price
                .unitPrice(unitPrice)
                .stock(stock)
                .salesVolume(qty * 10.0)             // estimate based on qty
                .returnRate(0.05)                    // default 5%
                .profit(unitPrice * qty * 0.4)       // estimate: 40% margin
                .demandScore(stock > 50 ? 0.7 : 0.4) // high stock → lower demand
                .priceCompetitivenessScore(0.7)
                .cartAbandonmentRate(0.3)
                .loyaltyScore(0.5)
                .shopPerformanceIndex(0.75)
                .category(item.getCategory() != null ? item.getCategory() : "General")
                .build();
    }

    /** Safe default when ML service is unavailable */
    private CartMLResponse defaultResponse(String productId) {
        return CartMLResponse.builder()
                .productId(productId)
                .promotionSuggestion("NO")
                .priceAdjustment("STABLE")
                .confidencePromo(0.0)
                .confidencePrice(0.0)
                .recommendedPrice(null)
                .expectedImpact("ML service unavailable")
                .modelUsed("fallback")
                .build();
    }
}
