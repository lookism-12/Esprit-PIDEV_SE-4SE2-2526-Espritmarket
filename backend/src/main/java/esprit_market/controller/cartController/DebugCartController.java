package esprit_market.controller.cartController;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * TEMPORARY DEBUG CONTROLLER
 * This controller bypasses all authentication to test if the cart logic works
 * DELETE THIS FILE AFTER AUTHENTICATION IS FIXED
 */
@RestController
@RequestMapping("/api/debug")
public class DebugCartController {

    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> simpleTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Debug endpoint is working!");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("backend_status", "Running");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cart-test")
    public ResponseEntity<Map<String, Object>> cartTest() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Cart debug endpoint reached");
        response.put("issue", "Original cart endpoints blocked by authentication");
        response.put("solution", "Need to fix JWT token validation or create valid test user");
        response.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(response);
    }
}