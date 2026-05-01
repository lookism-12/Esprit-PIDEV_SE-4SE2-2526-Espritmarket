package esprit_market.controller.paymentController;

import esprit_market.dto.cartDto.OrderResponse;
import esprit_market.dto.paymentDto.CardOtpConfirmationRequest;
import esprit_market.dto.paymentDto.CardOtpConfirmationResponse;
import esprit_market.dto.paymentDto.CardOtpRequest;
import esprit_market.dto.paymentDto.CardOtpResponse;
import esprit_market.dto.paymentDto.StripePaymentConfirmationRequest;
import esprit_market.dto.paymentDto.StripePaymentIntentResponse;
import esprit_market.service.cartService.AuthHelperService;
import esprit_market.service.paymentService.CardOtpPaymentService;
import esprit_market.service.paymentService.StripePaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final StripePaymentService stripePaymentService;
    private final CardOtpPaymentService cardOtpPaymentService;
    private final AuthHelperService authHelperService;

    @PostMapping("/card/request-otp")
    public ResponseEntity<CardOtpResponse> requestCardOtp(
            @Valid @RequestBody CardOtpRequest request,
            Authentication authentication) {
        ObjectId userId = authHelperService.getUserIdFromAuthentication(authentication);
        return ResponseEntity.ok(cardOtpPaymentService.requestOtp(userId, request));
    }

    @PostMapping("/card/confirm-otp")
    public ResponseEntity<CardOtpConfirmationResponse> confirmCardOtp(
            @Valid @RequestBody CardOtpConfirmationRequest request,
            Authentication authentication) {
        ObjectId userId = authHelperService.getUserIdFromAuthentication(authentication);
        return ResponseEntity.ok(cardOtpPaymentService.confirmOtp(userId, request));
    }

    @PostMapping("/stripe/create-cart-intent")
    public ResponseEntity<StripePaymentIntentResponse> createStripeCartIntent(Authentication authentication) {
        ObjectId userId = authHelperService.getUserIdFromAuthentication(authentication);
        return ResponseEntity.ok(stripePaymentService.createCartPaymentIntent(userId));
    }

    @PostMapping("/stripe/confirm")
    public ResponseEntity<OrderResponse> confirmStripePayment(
            @Valid @RequestBody StripePaymentConfirmationRequest request,
            Authentication authentication) {
        ObjectId userId = authHelperService.getUserIdFromAuthentication(authentication);
        return ResponseEntity.ok(stripePaymentService.confirmSucceededPayment(
                userId,
                request.getOrderId(),
                request.getPaymentIntentId()
        ));
    }
}
