package esprit_market.service.paymentService;

import esprit_market.dto.cartDto.CartResponse;
import esprit_market.dto.cartDto.OrderResponse;
import esprit_market.dto.paymentDto.StripePaymentIntentResponse;
import esprit_market.service.cartService.ICartService;
import esprit_market.service.cartService.IOrderService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StripePaymentService {
    private static final String STRIPE_API_BASE_URL = "https://api.stripe.com/v1";

    private final WebClient.Builder webClientBuilder;
    private final ICartService cartService;
    private final IOrderService orderService;

    @Value("${payment.stripe.secret-key:}")
    private String secretKey;

    @Value("${payment.stripe.publishable-key:}")
    private String publishableKey;

    @Value("${payment.stripe.currency:tnd}")
    private String currency;

    @Value("${payment.stripe.amount-multiplier:100}")
    private int amountMultiplier;

    @Value("${payment.stripe.request-three-d-secure:any}")
    private String requestThreeDSecure;

    public StripePaymentIntentResponse createCartPaymentIntent(ObjectId userId) {
        ensureStripeConfigured();

        CartResponse cart = cartService.getOrCreateCart(userId);
        if (Boolean.TRUE.equals(cart.getIsEmpty()) || cart.getTotal() == null || cart.getTotal() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        long amount = toMinorUnits(cart.getTotal());

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("amount", String.valueOf(amount));
        form.add("currency", normalizedCurrency());
        form.add("payment_method_types[]", "card");
        form.add("payment_method_options[card][request_three_d_secure]", requestThreeDSecure);
        form.add("metadata[userId]", userId.toHexString());
        form.add("metadata[cartId]", cart.getId());
        form.add("metadata[source]", "esprit_market_cart");
        form.add("description", "Esprit Market cart checkout");

        Map<String, Object> response = stripeClient()
                .post()
                .uri("/payment_intents")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(form))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null || response.get("client_secret") == null || response.get("id") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Stripe did not return a usable payment intent");
        }

        return StripePaymentIntentResponse.builder()
                .paymentIntentId(String.valueOf(response.get("id")))
                .clientSecret(String.valueOf(response.get("client_secret")))
                .publishableKey(publishableKey)
                .amount(amount)
                .displayAmount(cart.getTotal())
                .currency(normalizedCurrency())
                .status(String.valueOf(response.get("status")))
                .build();
    }

    public OrderResponse confirmSucceededPayment(ObjectId userId, String orderId, String paymentIntentId) {
        ensureStripeConfigured();

        OrderResponse order = orderService.getOrderById(userId, new ObjectId(orderId));
        Map<String, Object> intent = retrievePaymentIntent(paymentIntentId);

        String status = String.valueOf(intent.get("status"));
        if (!"succeeded".equals(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Stripe payment is not succeeded: " + status);
        }

        Map<String, Object> metadata = metadataFrom(intent);
        String metadataUserId = metadata != null ? String.valueOf(metadata.get("userId")) : null;
        if (!userId.toHexString().equals(metadataUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Payment intent does not belong to current user");
        }

        long paidAmount = numberToLong(intent.get("amount"));
        long expectedAmount = toMinorUnits(order.getFinalAmount());
        if (paidAmount != expectedAmount) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment amount does not match order amount");
        }

        return orderService.confirmPayment(userId, new ObjectId(orderId), paymentIntentId);
    }

    private Map<String, Object> retrievePaymentIntent(String paymentIntentId) {
        Map<String, Object> response = stripeClient()
                .get()
                .uri(uriBuilder -> uriBuilder.pathSegment("payment_intents", paymentIntentId).build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null || response.get("id") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Stripe payment intent could not be retrieved");
        }
        return response;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> metadataFrom(Map<String, Object> intent) {
        Object metadata = intent.get("metadata");
        if (metadata instanceof Map<?, ?>) {
            return (Map<String, Object>) metadata;
        }
        return null;
    }

    private WebClient stripeClient() {
        return webClientBuilder
                .baseUrl(STRIPE_API_BASE_URL)
                .defaultHeaders(headers -> headers.setBasicAuth(secretKey, ""))
                .build();
    }

    private void ensureStripeConfigured() {
        if (secretKey == null || secretKey.isBlank() || publishableKey == null || publishableKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe keys are not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY."
            );
        }
    }

    private long toMinorUnits(Double amount) {
        if (amount == null || amount <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment amount");
        }
        return Math.round(amount * amountMultiplier);
    }

    private long numberToLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(value));
    }

    private String normalizedCurrency() {
        return currency == null ? "tnd" : currency.trim().toLowerCase(Locale.ROOT);
    }
}
