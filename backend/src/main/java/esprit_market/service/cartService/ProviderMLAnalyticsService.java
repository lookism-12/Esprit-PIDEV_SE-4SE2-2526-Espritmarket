package esprit_market.service.cartService;

import esprit_market.dto.cartDto.CartMLRequest;
import esprit_market.dto.cartDto.CartMLResponse;
import esprit_market.dto.cartDto.ProviderMLAnalyticsDTO;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Fetches provider's products, enriches them with real sales data,
 * calls the Python ML service, and returns a full analytics report.
 */
@Service
@Slf4j
public class ProviderMLAnalyticsService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final CategoryRepository categoryRepository;
    private final WebClient mlWebClient;

    @Value("${app.cart-ml.enabled:true}")
    private boolean mlEnabled;

    @Value("${app.cart-ml.timeout-seconds:10}")
    private int timeoutSeconds;

    public ProviderMLAnalyticsService(
            UserRepository userRepository,
            ShopRepository shopRepository,
            ProductRepository productRepository,
            OrderItemRepository orderItemRepository,
            CategoryRepository categoryRepository,
            @Qualifier("cartMLWebClient") WebClient mlWebClient) {
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.productRepository = productRepository;
        this.orderItemRepository = orderItemRepository;
        this.categoryRepository = categoryRepository;
        this.mlWebClient = mlWebClient;
    }

    // ──────────────────────────────────────────────────────────
    // PUBLIC API
    // ──────────────────────────────────────────────────────────

    public ProviderMLAnalyticsDTO getAnalytics(String providerEmail) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new RuntimeException("Provider not found: " + providerEmail));

        Shop shop = shopRepository.findByOwnerId(provider.getId())
                .orElseThrow(() -> new RuntimeException("No shop found for provider: " + providerEmail));

        List<Product> products = productRepository.findByShopId(shop.getId());
        log.info("🤖 ML Analytics for shop '{}': {} products", shop.getName(), products.size());

        if (products.isEmpty()) {
            return emptyReport(shop);
        }

        // Build sales stats per product
        Map<ObjectId, Integer> salesByProduct = buildSalesMap(products);

        // Build category name cache
        Map<ObjectId, String> categoryNames = buildCategoryNameCache(products);

        // Build category price map for competitive context
        Map<String, List<Double>> categoryPrices = buildCategoryPriceMap(products, categoryNames);

        // Call ML for each product
        List<ProviderMLAnalyticsDTO.ProductMLPrediction> predictions = new ArrayList<>();
        for (Product product : products) {
            try {
                CartMLRequest req = buildMLRequest(product, salesByProduct, shop);
                CartMLResponse resp = callML(req);
                predictions.add(toPrediction(product, resp, salesByProduct, categoryPrices, categoryNames));
            } catch (Exception e) {
                log.warn("⚠️ ML failed for product {}: {}", product.getName(), e.getMessage());
                predictions.add(fallbackPrediction(product, salesByProduct, categoryPrices, categoryNames));
            }
        }

        // Build category insights
        List<ProviderMLAnalyticsDTO.CategoryInsight> categoryInsights =
                buildCategoryInsights(predictions);

        // Build top recommendations
        List<String> recommendations = buildRecommendations(predictions, shop.getName());

        return ProviderMLAnalyticsDTO.builder()
                .shopId(shop.getId().toHexString())
                .shopName(shop.getName())
                .totalProducts(products.size())
                .analyzedProducts(predictions.size())
                .promoEligibleCount(predictions.stream()
                        .filter(p -> "YES".equals(p.getPromotionSuggestion())).count())
                .priceIncreaseCount(predictions.stream()
                        .filter(p -> "INCREASE".equals(p.getPriceAdjustment())).count())
                .priceDecreaseCount(predictions.stream()
                        .filter(p -> "DECREASE".equals(p.getPriceAdjustment())).count())
                .priceStableCount(predictions.stream()
                        .filter(p -> "STABLE".equals(p.getPriceAdjustment())
                                  || "HOLD".equals(p.getPriceAdjustment())).count())
                .predictions(predictions)
                .categoryInsights(categoryInsights)
                .topRecommendations(recommendations)
                .build();
    }

    // ──────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────

    /** Count how many times each product was sold (from order_items) */
    private Map<ObjectId, Integer> buildSalesMap(List<Product> products) {
        List<ObjectId> productIds = products.stream().map(Product::getId).collect(Collectors.toList());
        List<OrderItem> items = orderItemRepository.findByProductIdIn(productIds);

        Map<ObjectId, Integer> map = new HashMap<>();
        for (OrderItem item : items) {
            if (item.getProductId() != null && item.getQuantity() != null) {
                map.merge(item.getProductId(), item.getQuantity(), Integer::sum);
            }
        }
        return map;
    }

    /** Build a map of categoryId → category name */
    private Map<ObjectId, String> buildCategoryNameCache(List<Product> products) {
        Set<ObjectId> catIds = products.stream()
                .filter(p -> p.getCategoryIds() != null && !p.getCategoryIds().isEmpty())
                .flatMap(p -> p.getCategoryIds().stream())
                .collect(Collectors.toSet());

        Map<ObjectId, String> cache = new HashMap<>();
        for (ObjectId catId : catIds) {
            categoryRepository.findById(catId).ifPresent(cat ->
                    cache.put(catId, cat.getName() != null ? cat.getName() : "General"));
        }
        return cache;
    }

    /** Average price per category across all products in the shop */
    private Map<String, List<Double>> buildCategoryPriceMap(List<Product> products,
                                                              Map<ObjectId, String> categoryNames) {
        Map<String, List<Double>> map = new HashMap<>();
        for (Product p : products) {
            String cat = resolveCategory(p, categoryNames);
            map.computeIfAbsent(cat, k -> new ArrayList<>()).add(p.getPrice());
        }
        return map;
    }

    private CartMLRequest buildMLRequest(Product product,
                                          Map<ObjectId, Integer> salesMap,
                                          Shop shop) {
        int salesVolume = salesMap.getOrDefault(product.getId(), 0);
        double unitPrice = product.getPrice();
        double costPrice = unitPrice * 0.6;   // estimate 60% cost
        double profit    = (unitPrice - costPrice) * salesVolume;

        // Heuristic scores based on stock and sales
        double demandScore = salesVolume > 50 ? 0.85
                           : salesVolume > 20 ? 0.65
                           : salesVolume > 5  ? 0.45
                           : 0.25;

        double stockRatio = product.getStock() > 0
                ? (double) salesVolume / product.getStock()
                : 0.0;

        double abandonRate = stockRatio > 2 ? 0.2 : stockRatio > 1 ? 0.35 : 0.5;

        return CartMLRequest.builder()
                .productId(product.getId().toHexString())
                .costPrice(costPrice)
                .unitPrice(unitPrice)
                .stock(product.getStock())
                .salesVolume(salesVolume)
                .returnRate(0.05)
                .profit(profit)
                .demandScore(demandScore)
                .priceCompetitivenessScore(0.7)
                .cartAbandonmentRate(abandonRate)
                .loyaltyScore(0.5)
                .shopPerformanceIndex(0.75)
                .category(resolveCategory(product))
                .build();
    }

    private CartMLResponse callML(CartMLRequest request) {
        if (!mlEnabled) return defaultMLResponse(request.getProductId());

        try {
            CartMLResponse resp = mlWebClient.post()
                    .uri("/predict")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(CartMLResponse.class)
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .block();
            return resp != null ? resp : defaultMLResponse(request.getProductId());
        } catch (Exception e) {
            log.debug("ML call failed for {}: {}", request.getProductId(), e.getMessage());
            return defaultMLResponse(request.getProductId());
        }
    }

    private ProviderMLAnalyticsDTO.ProductMLPrediction toPrediction(
            Product product,
            CartMLResponse resp,
            Map<ObjectId, Integer> salesMap,
            Map<String, List<Double>> categoryPrices,
            Map<ObjectId, String> categoryNames) {

        String cat = resolveCategory(product, categoryNames);
        List<Double> catPrices = categoryPrices.getOrDefault(cat, List.of(product.getPrice()));
        double avgCatPrice = catPrices.stream().mapToDouble(Double::doubleValue).average().orElse(product.getPrice());

        String pricePosition;
        if (product.getPrice() > avgCatPrice * 1.1)      pricePosition = "ABOVE_MARKET";
        else if (product.getPrice() < avgCatPrice * 0.9) pricePosition = "BELOW_MARKET";
        else                                              pricePosition = "AT_MARKET";

        return ProviderMLAnalyticsDTO.ProductMLPrediction.builder()
                .productId(product.getId().toHexString())
                .productName(product.getName())
                .category(cat)
                .currentPrice(product.getPrice())
                .stock(product.getStock())
                .salesVolume(salesMap.getOrDefault(product.getId(), 0))
                .promotionSuggestion(resp.getPromotionSuggestion())
                .priceAdjustment(resp.getPriceAdjustment())
                .confidencePromo(resp.getConfidencePromo())
                .confidencePrice(resp.getConfidencePrice())
                .recommendedPrice(resp.getRecommendedPrice())
                .expectedImpact(resp.getExpectedImpact())
                .modelUsed(resp.getModelUsed())
                .avgCategoryPrice(avgCatPrice)
                .pricePosition(pricePosition)
                .competitorCount(catPrices.size() - 1)
                .build();
    }

    private ProviderMLAnalyticsDTO.ProductMLPrediction fallbackPrediction(
            Product product,
            Map<ObjectId, Integer> salesMap,
            Map<String, List<Double>> categoryPrices,
            Map<ObjectId, String> categoryNames) {

        CartMLResponse fallback = defaultMLResponse(product.getId().toHexString());
        return toPrediction(product, fallback, salesMap, categoryPrices, categoryNames);
    }

    private List<ProviderMLAnalyticsDTO.CategoryInsight> buildCategoryInsights(
            List<ProviderMLAnalyticsDTO.ProductMLPrediction> predictions) {

        Map<String, List<ProviderMLAnalyticsDTO.ProductMLPrediction>> byCategory =
                predictions.stream().collect(Collectors.groupingBy(
                        ProviderMLAnalyticsDTO.ProductMLPrediction::getCategory));

        return byCategory.entrySet().stream().map(e -> {
            List<ProviderMLAnalyticsDTO.ProductMLPrediction> preds = e.getValue();
            double avgPrice = preds.stream().mapToDouble(p -> p.getCurrentPrice()).average().orElse(0);
            double avgStock = preds.stream().mapToDouble(p -> p.getStock()).average().orElse(0);
            long promoCount = preds.stream().filter(p -> "YES".equals(p.getPromotionSuggestion())).count();

            // Most common price action
            Map<String, Long> actionCounts = preds.stream()
                    .collect(Collectors.groupingBy(
                            ProviderMLAnalyticsDTO.ProductMLPrediction::getPriceAdjustment,
                            Collectors.counting()));
            String dominant = actionCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("STABLE");

            return ProviderMLAnalyticsDTO.CategoryInsight.builder()
                    .category(e.getKey())
                    .productCount(preds.size())
                    .avgPrice(Math.round(avgPrice * 100.0) / 100.0)
                    .avgStock((int) avgStock)
                    .promoCount(promoCount)
                    .dominantPriceAction(dominant)
                    .build();
        }).sorted(Comparator.comparing(ProviderMLAnalyticsDTO.CategoryInsight::getProductCount).reversed())
          .collect(Collectors.toList());
    }

    private List<String> buildRecommendations(
            List<ProviderMLAnalyticsDTO.ProductMLPrediction> predictions,
            String shopName) {

        List<String> recs = new ArrayList<>();

        long promoCount = predictions.stream().filter(p -> "YES".equals(p.getPromotionSuggestion())).count();
        if (promoCount > 0) {
            recs.add(String.format("🏷️ Apply promotions to %d product(s) to boost sales", promoCount));
        }

        long increaseCount = predictions.stream().filter(p -> "INCREASE".equals(p.getPriceAdjustment())).count();
        if (increaseCount > 0) {
            recs.add(String.format("📈 %d product(s) have high demand — consider raising prices by 5%%", increaseCount));
        }

        long decreaseCount = predictions.stream().filter(p -> "DECREASE".equals(p.getPriceAdjustment())).count();
        if (decreaseCount > 0) {
            recs.add(String.format("📉 %d product(s) are underperforming — lower prices to clear stock", decreaseCount));
        }

        long aboveMarket = predictions.stream().filter(p -> "ABOVE_MARKET".equals(p.getPricePosition())).count();
        if (aboveMarket > 0) {
            recs.add(String.format("⚠️ %d product(s) are priced above category average — review competitiveness", aboveMarket));
        }

        long lowStock = predictions.stream().filter(p -> p.getStock() < 5 && p.getSalesVolume() > 0).count();
        if (lowStock > 0) {
            recs.add(String.format("📦 %d product(s) have low stock but active sales — restock soon", lowStock));
        }

        if (recs.isEmpty()) {
            recs.add("✅ Your shop is performing well — maintain current strategy");
        }

        return recs;
    }

    private String resolveCategory(Product product, Map<ObjectId, String> categoryNames) {
        if (product.getCategoryIds() != null && !product.getCategoryIds().isEmpty()) {
            ObjectId catId = product.getCategoryIds().get(0);
            return categoryNames.getOrDefault(catId,
                    categoryRepository.findById(catId)
                            .map(c -> c.getName() != null ? c.getName() : "General")
                            .orElse("General"));
        }
        return "General";
    }

    // Keep old signature for backward compat (used in buildMLRequest before categoryNames is built)
    private String resolveCategory(Product product) {
        return resolveCategory(product, new HashMap<>());
    }

    private CartMLResponse defaultMLResponse(String productId) {
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

    private ProviderMLAnalyticsDTO emptyReport(Shop shop) {
        return ProviderMLAnalyticsDTO.builder()
                .shopId(shop.getId().toHexString())
                .shopName(shop.getName())
                .totalProducts(0)
                .analyzedProducts(0)
                .promoEligibleCount(0)
                .priceIncreaseCount(0)
                .priceDecreaseCount(0)
                .priceStableCount(0)
                .predictions(List.of())
                .categoryInsights(List.of())
                .topRecommendations(List.of("📦 Add products to your shop to get AI insights"))
                .build();
    }
}
