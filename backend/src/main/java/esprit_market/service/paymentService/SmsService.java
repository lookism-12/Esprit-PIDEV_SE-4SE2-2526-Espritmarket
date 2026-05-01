package esprit_market.service.paymentService;

import com.twilio.Twilio;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import esprit_market.config.TwilioProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    private final TwilioProperties twilioProperties;

    @PostConstruct
    public void init() {
        if (twilioProperties.getAccountSid() != null && twilioProperties.getAuthToken() != null) {
            Twilio.init(twilioProperties.getAccountSid(), twilioProperties.getAuthToken());
            log.info("Twilio Verify initialized successfully");
        } else {
            log.warn("Twilio configuration is incomplete. SMS Verify will fail.");
        }
    }

    public String getOtpReceiverPhoneNumber() {
        return normalizePhoneNumber(twilioProperties.getOtpReceiverPhoneNumber());
    }

    /**
     * Sends an OTP to the given phone number using Twilio Verify API.
     */
    public boolean sendVerificationCode(String phoneNumber) {
        validateConfig();
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        try {
            Verification verification = Verification.creator(
                    twilioProperties.getServiceSid(),
                    normalizedPhone,
                    "sms"
            ).create();

            log.info("OTP sent successfully to {}. Status: {}", normalizedPhone, verification.getStatus());
            return "pending".equalsIgnoreCase(verification.getStatus()) || "approved".equalsIgnoreCase(verification.getStatus());
        } catch (Exception ex) {
            log.error("Failed to send Twilio Verification SMS: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Twilio SMS send failed: " + ex.getMessage());
        }
    }

    /**
     * Verifies the OTP code for the given phone number using Twilio Verify API.
     */
    public boolean verifyCode(String phoneNumber, String code) {
        validateConfig();
        String normalizedPhone = normalizePhoneNumber(phoneNumber);

        try {
            VerificationCheck verificationCheck = VerificationCheck.creator(
                    twilioProperties.getServiceSid()
            )
            .setTo(normalizedPhone)
            .setCode(code)
            .create();

            log.info("Verification check for {}. Status: {}", normalizedPhone, verificationCheck.getStatus());
            return "approved".equalsIgnoreCase(verificationCheck.getStatus());
        } catch (Exception ex) {
            log.error("Failed to verify Twilio OTP: {}", ex.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Twilio OTP verification failed: " + ex.getMessage());
        }
    }

    /**
     * Ensures the phone number is in E.164 format (e.g. +216XXXXXXXX).
     */
    private String normalizePhoneNumber(String number) {
        if (number == null || number.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number cannot be empty");
        }
        String cleaned = number.replaceAll("[^\\d+]", "");
        if (!cleaned.startsWith("+")) {
            cleaned = "+" + cleaned;
        }
        return cleaned;
    }

    private void validateConfig() {
        if (twilioProperties.getAccountSid() == null || twilioProperties.getAccountSid().isEmpty() ||
            twilioProperties.getAuthToken() == null || twilioProperties.getAuthToken().isEmpty() ||
            twilioProperties.getServiceSid() == null || twilioProperties.getServiceSid().isEmpty()) {
            
            String errorMsg = "Twilio configuration is missing (ACCOUNT_SID, AUTH_TOKEN, or SERVICE_SID)";
            log.error(errorMsg);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, errorMsg);
        }
    }
}
