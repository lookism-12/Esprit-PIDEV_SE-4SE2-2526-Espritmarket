package esprit_market.service;

import esprit_market.Enum.marketplaceEnum.ProductStatus;
import esprit_market.config.RecommendationConfig;
import esprit_market.dto.recommendation.FeedbackRequestDTO;
import esprit_market.dto.recommendation.FeedbackResponseDTO;
import esprit_market.dto.recommendation.ProductRecommendationDTO;
import esprit_market.dto.recommendation.RecommendationDTO;
import esprit_market.entity.cart.Cart;
import esprit_market.entity.cart.CartItem;
import esprit_market.entity.cart.Order;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.CartItemRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Recommendation service combining two layers:
 *
 *  Layer 1 — MongoDB-based personalization (PRIMARY, always works):
 *    Reads the user's purchase history (order_items) and cart history,
 *    derives category affinity, and scores every unseen approved product.
 *    Works from the very first purchase or cart action — no warm-up needed.
 *
 *  Layer 2 — ML microservice collaborative filtering (OPTIONAL boost):
 *    When the ML service is available and has interaction data for this user,
 *    its scores are blended in to re-rank the MongoDB candidates.
 *    If the ML service is down or cold, Layer 1 results are used as-is.
 */
@Service
@Slf4j
public class RecommendationService {

    private final WebClient webClient;
    private final RecommendationConfig config;
    private final MockRecommendationService mockService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    public RecommendationService(
            @Qualifier("recommendationWebClient") WebClient webClient,
            RecommendationConfig config,
            MockRecommendationService mockService,
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            UserRepository userRepository,
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            CartRepository cartRepository,
            CartItemRepository cartItemRepository) {
        this.webClient = webClient;
        this.config = config;
        this.mockService = mockService;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, String> buildCategoryNameMap() {
        return categoryRepository.findAll().stream()
                .collect(Collectors.toMap(
                        c -> c.getId().toHexString(),
                        Category::getName,
                        (a, b) -> a));
    }

    /**
     * Collect all product IDs the user has interacted with, weighted by signal:
     *   purchase → 5.0  (completed orders)
     *   cart     → 3.0  (current cart items)
     */
    private Map<String, Double> getUserInteractionScores(String userId) {
        Map<String, Double> scores = new LinkedHashMap<>();
        try {
            ObjectId uid = new ObjectId(userId);
            User user = userRepository.findById(uid).orElse(null);
            if (user == null) return scores;

            // Purchase history
            List<Order> orders = orderRepository.findByUser(user);
            if (!orders.isEmpty()) {
                List<ObjectId> orderIds = orders.stream().map(Order::getId).collect(Collectors.toList());
                for (OrderItem item : orderItemRepository.findByOrderIdIn(orderIds)) {
                    if (item.getProductId() != null) {
                        scores.merge(item.getProductId().toHexString(), 5.0, Double::sum);
                    }
                }
            }

            // Cart history
            List<Cart> carts = cartRepository.findByUserId(uid);
            if (!carts.isEmpty()) {
                List<ObjectId> cartIds = carts.stream().map(Cart::getId).collect(Collectors.toList());
                for (CartItem item : cartItemRepository.findByCartIdIn(cartIds)) {
                    if (item.getProductId() != null) {
                        scores.merge(item.getProductId().toHexString(), 3.0, Double::sum);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not load interaction history for user {}: {}", userId, e.getMessage());
        }
        return scores;
    }

    // ── Layer 1: MongoDB-based personalization ────────────────────────────────

    private RecommendationDTO buildPersonalizedFromMongo(String userId, int topK) {
        Map<String, String> catNames = buildCategoryNameMap();

        // All approved products
        List<Product> allApproved = productRepository.findByStatus(ProductStatus.APPROVED);
        if (allApproved.isEmpty()) {
            allApproved = productRepository.findAll();
        }
        Map<String, Product> productMap = allApproved.stream()
                .collect(Collectors.toMap(p -> p.getId().toHexString(), p -> p, (a, b) -> a));

        // User interaction history
        Map<String, Double> interactionScores = getUserInteractionScores(userId);
        Set<String> alreadySeen = interactionScores.keySet();

        // Category affinity: categoryId → cumulative score
        Map<String, Double> categoryAffinity = new LinkedHashMap<>();
        for (Map.Entry<String, Double> entry : interactionScores.entrySet()) {
            Product p = productMap.get(entry.getKey());
            if (p != null && p.getCategoryIds() != null) {
                for (ObjectId catId : p.getCategoryIds()) {
                    categoryAffinity.merge(catId.toHexString(), entry.getValue(), Double::sum);
                }
            }
        }

        boolean hasHistory = !interactionScores.isEmpty();
        log.info("User {} — hasHistory={}, affinity categories: {}",
                userId, hasHistory, categoryAffinity.size());

        // Score every unseen in-stock approved product
        Map<String, Double> candidateScores = new LinkedHashMap<>();
        for (Product p : allApproved) {
            String pid = p.getId().toHexString();
            if (alreadySeen.contains(pid) || p.getStock() <= 0) continue;

            double score = 0.0;

            // Category affinity signal (strongest)
            if (hasHistory && p.getCategoryIds() != null) {
                for (ObjectId catId : p.getCategoryIds()) {
                    score += categoryAffinity.getOrDefault(catId.toHexString(), 0.0) * 2.0;
                }
            }

            // Recency bonus (newer = slightly higher)
            if (p.getCreatedAt() != null) {
                long daysOld = ChronoUnit.DAYS.between(p.getCreatedAt(), java.time.LocalDateTime.now());
                score += Math.max(0, 30 - daysOld) * 0.1;
            }

            // Stock depth bonus
            score += Math.min(p.getStock(), 10) * 0.05;

            candidateScores.put(pid, score);
        }

        // Rank by score
        List<Map.Entry<String, Double>> ranked = candidateScores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(topK)
                .collect(Collectors.toList());

        // Cold-start fallback: newest approved products
        if (ranked.isEmpty()) {
            ranked = productMap.entrySet().stream()
                    .filter(e -> e.getValue().getStock() > 0)
                    .sorted((a, b) -> {
                        if (a.getValue().getCreatedAt() == null) return 1;
                        if (b.getValue().getCreatedAt() == null) return -1;
                        return b.getValue().getCreatedAt().compareTo(a.getValue().getCreatedAt());
                    })
                    .limit(topK)
                    .map(e -> Map.entry(e.getKey(), 0.5))
                    .collect(Collectors.toList());
        }

        double maxScore = ranked.stream().mapToDouble(Map.Entry::getValue).max().orElse(1.0);

        List<ProductRecommendationDTO> recs = ranked.stream().map(entry -> {
            Product p = productMap.get(entry.getKey());
            if (p == null) return null;

            double normalised = maxScore > 0 ? Math.min(entry.getValue() / maxScore, 1.0) : 0.5;

            String catName = "";
            if (p.getCategoryIds() != null && !p.getCategoryIds().isEmpty()) {
                catName = catNames.getOrDefault(p.getCategoryIds().get(0).toHexString(), "");
            }

            String reason;
            if (!hasHistory) {
                reason = "Trending in the marketplace";
            } else if (p.getCategoryIds() != null && p.getCategoryIds().stream()
                    .anyMatch(c -> categoryAffinity.containsKey(c.toHexString()))) {
                reason = "Based on your interest in " + (catName.isEmpty() ? "this category" : catName);
            } else {
                reason = "Popular in the marketplace";
            }

            String imageUrl = (p.getImages() != null && !p.getImages().isEmpty())
                    ? p.getImages().get(0).getUrl() : null;

            return ProductRecommendationDTO.builder()
                    .productId(entry.getKey())
                    .name(p.getName())
                    .price(p.getPrice())
                    .category(catName)
                    .imageUrl(imageUrl)
                    .inStock(p.getStock() > 0)
                    .isNegotiable(false)
                    .score(normalised)
                    .reason(reason)
                    .build();
        }).filter(Objects::nonNull).collect(Collectors.toList());

        String algo = hasHistory
                ? "category-affinity+purchase-history+cart-history"
                : "popularity+recency";

        return RecommendationDTO.builder()
                .userId(userId)
                .recommendations(recs)
                .totalCount(recs.size())
                .algorithmUsed(algo)
                .generatedAt(java.time.Instant.now().toString())
                .build();
    }

    // ── Layer 2: ML boost (optional) ─────────────────────────────────────────

    /**
     * Try to get ML scores and blend them into the MongoDB-ranked list.
     * Uses a 5-second timeout — never blocks the response if ML is slow.
     */
    private RecommendationDTO tryMlEnrichment(RecommendationDTO mongoResult, String userId) {
        if (!config.isEnabled()) return mongoResult;
        try {
            RecommendationDTO mlResult = webClient
                    .get()
                    .uri("/recommend/{userId}", userId)
                    .retrieve()
                    .bodyToMono(RecommendationDTO.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn(null)
                    .block();

            if (mlResult == null || mlResult.getRecommendations() == null
                    || mlResult.getRecommendations().isEmpty()) {
                return mongoResult;
            }

            // ML score map: productId → score
            Map<String, Double> mlScores = mlResult.getRecommendations().stream()
                    .filter(r -> r.getProductId() != null && r.getScore() != null)
                    .collect(Collectors.toMap(
                            ProductRecommendationDTO::getProductId,
                            ProductRecommendationDTO::getScore,
                            (a, b) -> a));

            // Blend: 60% MongoDB affinity + 40% ML collaborative score
            List<ProductRecommendationDTO> reRanked = mongoResult.getRecommendations().stream()
                    .map(rec -> {
                        double mlBoost = mlScores.getOrDefault(rec.getProductId(), 0.0);
                        double combined = rec.getScore() * 0.6 + mlBoost * 0.4;
                        String reason = mlBoost > 0.7 ? "Highly recommended for you" : rec.getReason();
                        return ProductRecommendationDTO.builder()
                                .productId(rec.getProductId())
                                .name(rec.getName())
                                .price(rec.getPrice())
                                .category(rec.getCategory())
                                .imageUrl(rec.getImageUrl())
                                .inStock(rec.getInStock())
                                .isNegotiable(rec.getIsNegotiable())
                                .score(Math.min(combined, 1.0))
                                .reason(reason)
                                .build();
                    })
                    .sorted(Comparator.comparingDouble(ProductRecommendationDTO::getScore).reversed())
                    .collect(Collectors.toList());

            mongoResult.setRecommendations(reRanked);
            mongoResult.setAlgorithmUsed("category-affinity+collaborative-filtering");
            log.info("ML enrichment applied for user {}", userId);
            return mongoResult;

        } catch (Exception e) {
            log.debug("ML enrichment skipped for user {}: {}", userId, e.getMessage());
            return mongoResult;
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Get personalized recommendations for a user.
     *
     * 1. Build from MongoDB (purchase + cart → category affinity) — always works
     * 2. Optionally boost with ML collaborative filtering scores
     * 3. Return top-5 enriched results
     */
    public RecommendationDTO getRecommendations(String userId) {
        log.info("Building recommendations for user: {}", userId);

        RecommendationDTO result = buildPersonalizedFromMongo(userId, 8);
        result = tryMlEnrichment(result, userId);

        // Trim to 5
        if (result.getRecommendations().size() > 5) {
            result.setRecommendations(result.getRecommendations().subList(0, 5));
            result.setTotalCount(5);
        }

        log.info("Returning {} recommendations for user {} (algo: {})",
                result.getTotalCount(), userId, result.getAlgorithmUsed());
        return result;
    }

    /** Send interaction feedback to ML service (fire-and-forget). */
    public FeedbackResponseDTO sendFeedback(String userId, String productId, String action) {
        if (!config.isEnabled()) {
            return mockService.getMockFeedbackResponse(userId, productId, action);
        }
        try {
            FeedbackResponseDTO result = webClient
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/feedback")
                            .queryParam("user_id", userId)
                            .queryParam("product_id", productId)
                            .queryParam("action", action)
                            .build())
                    .retrieve()
                    .bodyToMono(FeedbackResponseDTO.class)
                    .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                    .retryWhen(Retry.backoff(config.getMaxRetries(), Duration.ofSeconds(1))
                            .filter(this::isRetryableException))
                    .onErrorReturn(null)
                    .block();
            return result != null ? result : mockService.getMockFeedbackResponse(userId, productId, action);
        } catch (Exception e) {
            log.debug("Feedback send failed for user {}: {}", userId, e.getMessage());
            return mockService.getMockFeedbackResponse(userId, productId, action);
        }
    }

    public FeedbackResponseDTO sendFeedback(FeedbackRequestDTO feedbackRequest) {
        return sendFeedback(
                feedbackRequest.getUserId(),
                feedbackRequest.getProductId(),
                feedbackRequest.getAction());
    }

    public boolean isServiceAvailable() {
        if (!config.isEnabled()) return false;
        try {
            webClient.get().uri("/health").retrieve()
                    .bodyToMono(String.class).timeout(Duration.ofSeconds(5)).block();
            return true;
        } catch (Exception e) {
            log.warn("ML service not available: {}", e.getMessage());
            return false;
        }
    }

    private boolean isRetryableException(Throwable throwable) {
        if (throwable instanceof WebClientResponseException ex) {
            return ex.getStatusCode().is5xxServerError();
        }
        return throwable instanceof WebClientException;
    }
}
