package esprit_market.controller.paymentController;

import esprit_market.service.paymentService.SmsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
public class SmsController {

    private final SmsService smsService;

    /**
     * Endpoint to send an OTP SMS to a given phone number.
     * Example: POST /api/sms/send?phone=+216XXXXXXXX
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendOtp(@RequestParam String phone) {
        log.info("REST request to send OTP to {}", phone);
        
        boolean success = smsService.sendVerificationCode(phone);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", success);
        response.put("message", success ? "OTP sent successfully" : "Failed to send OTP");
        
        if (success) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Endpoint to verify an OTP SMS code for a given phone number.
     * Example: POST /api/sms/verify?phone=+216XXXXXXXX&code=123456
     */
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(
            @RequestParam String phone,
            @RequestParam String code) {
        log.info("REST request to verify OTP for {}", phone);
        
        boolean isVerified = smsService.verifyCode(phone, code);
        
        Map<String, Object> response = new HashMap<>();
        response.put("verified", isVerified);
        response.put("message", isVerified ? "Phone number verified successfully" : "Invalid or expired OTP code");
        
        if (isVerified) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
}
