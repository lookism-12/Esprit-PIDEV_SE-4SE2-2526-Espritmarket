package esprit_market.service.paymentService;

import esprit_market.dto.cartDto.CartResponse;
import esprit_market.dto.paymentDto.CardOtpConfirmationRequest;
import esprit_market.dto.paymentDto.CardOtpConfirmationResponse;
import esprit_market.dto.paymentDto.CardOtpRequest;
import esprit_market.dto.paymentDto.CardOtpResponse;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.ICartService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class CardOtpPaymentService {
    private final ICartService cartService;
    private final UserRepository userRepository;
    private final SmsService smsService;
    private final Map<String, CardOtpSession> sessions = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${payment.card-otp.ttl-minutes:5}")
    private int otpTtlMinutes;

    public CardOtpResponse requestOtp(ObjectId userId, CardOtpRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        validateCardSummary(request);
        CartResponse cart = cartService.getOrCreateCart(userId);
        if (Boolean.TRUE.equals(cart.getIsEmpty()) || cart.getTotal() == null || cart.getTotal() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        String phoneNumber = smsService.getOtpReceiverPhoneNumber();
        String verificationId = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(Math.max(1, otpTtlMinutes));

        sessions.put(verificationId, CardOtpSession.builder()
                .userId(userId.toHexString())
                .code("")
                .cardLast4(request.getCardLast4())
                .phoneNumber(phoneNumber)
                .expiresAt(expiresAt)
                .consumed(false)
                .build());

        smsService.sendVerificationCode(phoneNumber);

        return CardOtpResponse.builder()
                .verificationId(verificationId)
                .maskedCard("**** **** **** " + request.getCardLast4())
                .maskedPhone(maskPhone(phoneNumber))
                .expiresAt(expiresAt)
                .status("OTP_SENT")
                .message("SMS verification code sent")
                .build();
    }

    public CardOtpConfirmationResponse confirmOtp(ObjectId userId, CardOtpConfirmationRequest request) {
        CardOtpSession session = sessions.get(request.getVerificationId());
        if (session == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Verification session not found");
        }
        if (!userId.toHexString().equals(session.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Verification session does not belong to current user");
        }
        if (session.isConsumed()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Verification code was already used");
        }
        if (LocalDateTime.now().isAfter(session.getExpiresAt())) {
            sessions.remove(request.getVerificationId());
            throw new ResponseStatusException(HttpStatus.GONE, "Verification code expired");
        }
        if (!smsService.verifyCode(session.getPhoneNumber(), request.getOtpCode())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP code");
        }

        session.setConsumed(true);
        String transactionId = "OTP-" + request.getVerificationId();

        return CardOtpConfirmationResponse.builder()
                .transactionId(transactionId)
                .status("VERIFIED")
                .message("Card OTP verification completed")
                .build();
    }

    private void validateCardSummary(CardOtpRequest request) {
        if (request.getCardholderName() == null || request.getCardholderName().trim().length() < 3) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cardholder name is required");
        }
        if (!isExpiryValid(request.getExpiryMonth(), request.getExpiryYear())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Card expiry date is invalid");
        }
        String last4 = request.getCardLast4() == null ? "" : request.getCardLast4().trim();
        if (!last4.matches("\\d{4}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Card last 4 digits are invalid");
        }
    }

    private boolean isExpiryValid(String monthValue, String yearValue) {
        try {
            int month = Integer.parseInt(monthValue.trim());
            int year = Integer.parseInt(yearValue.trim());
            if (year < 100) {
                year += 2000;
            }
            if (month < 1 || month > 12) {
                return false;
            }
            return !YearMonth.of(year, month).isBefore(YearMonth.now());
        } catch (NumberFormatException ex) {
            return false;
        }
    }



    private String maskPhone(String phoneNumber) {
        String digits = phoneNumber.replaceAll("\\D", "");
        if (digits.length() <= 4) {
            return "****";
        }
        return "+" + "*".repeat(Math.max(0, digits.length() - 4)) + digits.substring(digits.length() - 4);
    }

    @Data
    @Builder
    private static class CardOtpSession {
        private String userId;
        private String code;
        private String cardLast4;
        private String phoneNumber;
        private LocalDateTime expiresAt;
        private boolean consumed;
    }
}
