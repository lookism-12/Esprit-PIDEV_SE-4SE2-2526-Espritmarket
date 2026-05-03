package esprit_market.controller.cartController;

import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.dto.cartDto.CartMLResponse;
import esprit_market.dto.cartDto.CartResponse;
import esprit_market.service.cartService.CartMLService;
import esprit_market.service.cartService.ICartService;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
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
 * Exposes Cart ML predictions to the Angular frontend.
 * Endpoint: /api/cart/ml/*
 */
@Slf4j
@RestController
@RequestMapping("/api/cart/ml")
@RequiredArgsConstructor
@Tag(name = "Cart ML", description = "ML-powered promotion and price suggestions for cart items")
public class CartMLController {

    private final CartMLService  cartMLService;
    private final ICartService   cartService;
    private final UserRepository userRepository;

    private ObjectId resolveUserId(Authentication auth) {
        if (auth == null) throw new IllegalStateException("Authentication required");
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalStateException("User not found: " + auth.getName()));
        return user.getId();
    }

    private List<CartItemResponse> getItems(ObjectId userId) {
        CartResponse cart = cartService.getOrCreateCart(userId);
        return cartService.findByCartId(new ObjectId(cart.getId()));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Get ML suggestions for all cart items")
    public ResponseEntity<List<CartMLResponse>> getSuggestions(Authentication auth) {
        try {
            ObjectId userId = resolveUserId(auth);
            List<CartItemResponse> items = getItems(userId);
            if (items == null || items.isEmpty()) return ResponseEntity.ok(List.of());
            List<CartMLResponse> suggestions = cartMLService.predictBatch(items);
            log.info("🤖 Cart ML: {} suggestions for user {}", suggestions.size(), auth.getName());
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            log.warn("⚠️ Cart ML suggestions failed: {}", e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/suggest/{productId}")
    @Operation(summary = "Get ML suggestion for a single cart item")
    public ResponseEntity<CartMLResponse> getSuggestion(
            @PathVariable String productId, Authentication auth) {
        try {
            ObjectId userId = resolveUserId(auth);
            List<CartItemResponse> items = getItems(userId);
            CartItemResponse item = items.stream()
                    .filter(i -> productId.equals(i.getProductId()))
                    .findFirst().orElse(null);
            if (item == null) return ResponseEntity.notFound().build();
            return ResponseEntity.ok(cartMLService.predict(item));
        } catch (Exception e) {
            log.warn("⚠️ Cart ML single suggestion failed: {}", e.getMessage());
            return ResponseEntity.ok(CartMLResponse.builder()
                    .productId(productId).promotionSuggestion("NO")
                    .priceAdjustment("STABLE").confidencePromo(0.0)
                    .confidencePrice(0.0).expectedImpact("ML service unavailable")
                    .modelUsed("fallback").build());
        }
    }

    @GetMapping("/health")
    @Operation(summary = "Check Cart ML service health")
    public ResponseEntity<Map<String, String>> health() {
        boolean up = cartMLService.isServiceAvailable();
        return ResponseEntity.ok(Map.of(
                "cartMLService", up ? "UP" : "DOWN",
                "message", up ? "ML service is running" : "ML service unavailable — using fallback"));
    }
}
