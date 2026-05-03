package esprit_market.service.marketplaceService;

import esprit_market.dto.cartDto.CartMLRequest;
import esprit_market.dto.cartDto.CartMLResponse;
import esprit_market.entity.marketplace.Product;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Calls the Cart ML Python service (port 8002) for marketplace-level
 * product insights: promotion badges and price adjustment signals.
 *
 * Uses the same /predict and /predict/batch endpoints as the cart ML,
 * but builds the request from Product entity fields instead of CartItem.
 */
@Service
@Slf4j
public class MarketplaceMLService {

    private final WebClient webClient;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;

    @Value("${app.cart-ml.enabled:true}")
    private boolean enabled;

    @Value("${app.cart-ml.timeout-seconds:10}")
    private int timeoutSeconds;

    public MarketplaceMLService(
            @Qualifier("cartMLWebClient") WebClient webClient,
            ProductRepository productRepository,
            OrderItemRepository orderItemRepository) {
        this.webClient          = webClient;
        this.productRepository  = productRepository;
        this.orderItemRepository = orderItemRepository;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Single product prediction */
    public CartMLResponse predictForProduct(String productId) {
        if (!enabled) return fallback(productId);
        try {
            Product p = productRepository.findById(new ObjectId(productId)).orElse(null);
            if (p == null) return fallback(productId);
            return callPredict(buildRequest(p));
        } catch (Exception e) {
            log.warn("⚠️ Marketplace ML single predict failed for {}: {}", productId, e.getMessage());
            return fallback(productId);
        }
    }

    /** Batch prediction for a list of product IDs */
    public List<CartMLResponse> predictBatch(List<String> productIds) {
        if (!enabled || productIds == null || productIds.isEmpty()) return List.of();

        List<Product> products = productIds.stream()
                .map(id -> {
                    try { return productRepository.findById(new ObjectId(id)).orElse(null); }
                    catch (Exception e) { return null; }
                })
                .filter(p -> p != null)
                .collect(Collectors.toList());

        if (products.isEmpty()) return List.of();

        List<CartMLRequest> requests = products.stream()
                .map(this::buildRequest)
                .collect(Collectors.toList());

        try {
            Map<String, Object> body = Map.of("products", requests);

            List<CartMLResponse> responses = webClient.post()
                    .uri("/predict/batch")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToFlux(CartMLResponse.class)
                    .collectList()
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();

            log.info("🤖 Marketplace ML batch: {} predictions", responses != null ? responses.size() : 0);
            return responses != null ? responses : List.of();

        } catch (Exception e) {
            log.warn("⚠️ Marketplace ML batch failed: {}", e.getMessage());
            return products.stream()
                    .map(p -> fallback(p.getId().toHexString()))
                    .collect(Collectors.toList());
        }
    }

    /** Health check */
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

    // ── Private helpers ───────────────────────────────────────────────────────

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
                log.debug("🤖 Marketplace ML [{}]: promo={} price={}",
                        request.getProductId(),
                        response.getPromotionSuggestion(),
                        response.getPriceAdjustment());
            }
            return response != null ? response : fallback(request.getProductId());
        } catch (Exception e) {
            log.warn("⚠️ Marketplace ML predict error: {}", e.getMessage());
            return fallback(request.getProductId());
        }
    }

    /**
     * Build an ML request from a Product entity.
     * Fields not stored on Product are estimated from available data.
     */
    private CartMLRequest buildRequest(Product p) {
        String productId = p.getId().toHexString();
        double price     = p.getPrice();
        int    stock     = p.getStock();

        // Estimate sales volume from order history (count of order items for this product)
        long salesCount = 0;
        try {
            salesCount = orderItemRepository.countByProductId(p.getId());
        } catch (Exception ignored) {}

        double salesVolume = salesCount > 0 ? (double) salesCount : estimateSalesVolume(stock, price);
        double costPrice   = price * 0.55;   // estimate: 55% cost ratio
        double profit      = (price - costPrice) * salesVolume;

        // Derive demand score from stock-to-sales ratio
        double demandScore = salesVolume > 0
                ? Math.min(1.0, salesVolume / (stock + salesVolume + 1.0))
                : (stock < 10 ? 0.8 : 0.3);

        // Category name
        String category = "General";

        return CartMLRequest.builder()
                .productId(productId)
                .costPrice(costPrice)
                .unitPrice(price)
                .stock(stock)
                .salesVolume(salesVolume)
                .returnRate(0.05)
                .profit(profit)
                .demandScore(demandScore)
                .priceCompetitivenessScore(0.65)
                .cartAbandonmentRate(stock > 100 ? 0.55 : 0.25)
                .loyaltyScore(0.5)
                .shopPerformanceIndex(0.7)
                .category(category)
                .build();
    }

    /** Rough sales estimate when no order history exists */
    private double estimateSalesVolume(int stock, double price) {
        if (price < 50)  return 300;
        if (price < 150) return 150;
        if (price < 500) return 60;
        return 20;
    }

    private CartMLResponse fallback(String productId) {
        return CartMLResponse.builder()
                .productId(productId)
                .promotionSuggestion("NO")
                .priceAdjustment("STABLE")
                .confidencePromo(0.0)
                .confidencePrice(0.0)
                .expectedImpact("ML service unavailable")
                .modelUsed("fallback")
                .build();
    }
}
