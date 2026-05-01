package esprit_market.service.paymentService;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import esprit_market.config.TwilioProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwilioMessagingService {

    private final TwilioProperties twilioProperties;

    @PostConstruct
    public void init() {
        if (twilioProperties.getAccountSid() != null && !twilioProperties.getAccountSid().isEmpty() &&
            twilioProperties.getAuthToken() != null && !twilioProperties.getAuthToken().isEmpty()) {
            Twilio.init(twilioProperties.getAccountSid(), twilioProperties.getAuthToken());
            log.info("Twilio initialized successfully");
        } else {
            log.warn("Twilio configuration is incomplete. SMS sending will fail.");
        }
    }

    public String getOtpReceiverPhoneNumber() {
        return normalizeRecipientNumber(twilioProperties.getOtpReceiverPhoneNumber());
    }

    public void sendOtpSms(String otpCode, int ttlMinutes) {
        String to = getOtpReceiverPhoneNumber();
        String messageBody = String.format("Votre code de vérification EspritMarket est %s. " +
                "Il est valide pendant %d minutes. Ne le partagez avec personne.", otpCode, ttlMinutes);

        sendSms(to, messageBody);
    }

    public void sendSms(String to, String messageBody) {
        validateConfig();

        try {
            Message message = Message.creator(
                    new PhoneNumber(to),
                    new PhoneNumber(twilioProperties.getPhoneNumber()),
                    messageBody
            ).create();
            
            log.info("Twilio SMS sent successfully. SID: {}", message.getSid());
        } catch (Exception ex) {
            log.error("Failed to send Twilio SMS: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Twilio SMS send failed: " + ex.getMessage());
        }
    }

    private String normalizeRecipientNumber(String number) {
        if (number == null || number.trim().isEmpty()) {
            return null;
        }
        String cleaned = number.replaceAll("[^\\d+]", "");
        if (!cleaned.startsWith("+")) {
            cleaned = "+" + cleaned;
        }
        return cleaned;
    }

    private void validateConfig() {
        List<String> errors = new ArrayList<>();
        require(errors, twilioProperties.getAccountSid(), "Missing TWILIO_ACCOUNT_SID");
        require(errors, twilioProperties.getAuthToken(), "Missing TWILIO_AUTH_TOKEN");
        require(errors, twilioProperties.getPhoneNumber(), "Missing TWILIO_PHONE_NUMBER");
        require(errors, twilioProperties.getOtpReceiverPhoneNumber(), "Missing OTP_RECEIVER_PHONE_NUMBER");

        if (!errors.isEmpty()) {
            String errorMsg = "Twilio config error: " + String.join(", ", errors);
            log.error(errorMsg);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, errorMsg);
        }
    }

    private void require(List<String> errors, String value, String errorMessage) {
        if (value == null || value.trim().isEmpty()) {
            errors.add(errorMessage);
        }
    }
}
