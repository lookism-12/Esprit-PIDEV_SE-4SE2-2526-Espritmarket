package esprit_market.controller.cartController;

import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.dto.cartDto.CartMLResponse;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.CartMLService;
import esprit_market.service.cartService.ICartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST endpoints that expose Cart ML predictions to the Angular frontend.
 *
 * Base path: /api/cart/ml
 */
@RestController
@RequestMapping("/api/cart/ml")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Cart ML", description = "ML-powered promotion and price suggestions for cart items")
public class CartMLController {

    private final CartMLService cartMLService;
    private final ICartService  cartService;
    private final UserRepository userRepository;

    // ──────────────────────────────────────────────────────────
    // HELPER
    // ──────────────────────────────────────────────────────────

    private ObjectId resolveUserId(Authentication auth) {
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return user.getId();
    }

    // ──────────────────────────────────────────────────────────
    // ENDPOINTS
    // ──────────────────────────────────────────────────────────

    /**
     * GET /api/cart/ml/suggestions
     *
     * Returns ML promotion + price suggestions for every item in the
     * authenticated user's current cart.
     */
    @GetMapping("/suggestions")
    @Operation(
        summary = "Get ML suggestions for cart",
        description = "Returns promotion and price-adjustment suggestions for all items in the user's cart"
    )
    public ResponseEntity<List<CartMLResponse>> getCartSuggestions(Authentication auth) {
        ObjectId userId = resolveUserId(auth);
        log.info("🛒 ML suggestions requested for user {}", userId);

        // Load current cart, then its items
        CartItemResponse[] items;
        try {
            var cart = cartService.getCartByUserId(userId);
            if (cart == null || cart.getId() == null) {
                return ResponseEntity.ok(List.of());
            }
            var cartItems = cartService.findByCartId(new ObjectId(cart.getId()));
            if (cartItems == null || cartItems.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }
            List<CartMLResponse> predictions = cartMLService.predictBatch(cartItems);
            log.info("✅ Returning {} ML predictions", predictions.size());
            return ResponseEntity.ok(predictions);
        } catch (Exception e) {
            log.warn("⚠️ Could not load cart for ML suggestions: {}", e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * GET /api/cart/ml/suggest/{productId}
     *
     * Returns ML suggestion for a single product already in the cart.
     */
    @GetMapping("/suggest/{productId}")
    @Operation(
        summary = "Get ML suggestion for one cart item",
        description = "Returns promotion and price-adjustment suggestion for a specific product"
    )
    public ResponseEntity<CartMLResponse> getSingleSuggestion(
            @PathVariable String productId,
            Authentication auth) {

        ObjectId userId = resolveUserId(auth);

        try {
            var cart = cartService.getCartByUserId(userId);
            if (cart == null || cart.getId() == null) {
                return ResponseEntity.notFound().build();
            }
            List<CartItemResponse> items = cartService.findByCartId(new ObjectId(cart.getId()));
            CartItemResponse item = items.stream()
                    .filter(i -> productId.equals(i.getProductId()))
                    .findFirst()
                    .orElse(null);

            if (item == null) {
                return ResponseEntity.notFound().build();
            }

            CartMLResponse prediction = cartMLService.predict(item);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            log.warn("⚠️ Could not get ML suggestion for product {}: {}", productId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * GET /api/cart/ml/health
     *
     * Checks if the Python ML service is reachable.
     */
    @GetMapping("/health")
    @Operation(summary = "Check Cart ML service health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean available = cartMLService.isServiceAvailable();
        return ResponseEntity.ok(Map.of(
                "cartMLService", available ? "UP" : "DOWN",
                "message", available
                        ? "ML service is running"
                        : "ML service unavailable – rule-based fallback active"
        ));
    }
}
