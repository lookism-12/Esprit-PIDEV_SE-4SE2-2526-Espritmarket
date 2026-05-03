package esprit_market.controller.gamification;

import esprit_market.dto.gamification.*;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.gamification.WheelOfFortuneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wheel")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Wheel of Fortune", description = "Gamification - Spin to Win rewards")
@SecurityRequirement(name = "Bearer Authentication")
public class WheelOfFortuneController {

    private final WheelOfFortuneService wheelService;
    private final UserRepository userRepository;

    // ── helpers ──────────────────────────────────────────────────────────────

    /** JWT subject is the user's email — resolve to the User entity. */
    private User resolveUser(Authentication auth) {
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    // ── endpoints ─────────────────────────────────────────────────────────────

    @PostMapping("/spin")
    @Operation(summary = "Spin the wheel")
    public ResponseEntity<?> spin(Authentication authentication, HttpServletRequest request) {
        try {
            User user = resolveUser(authentication);
            SpinResultDTO result = wheelService.spin(user.getId(), request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Spin failed: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/rewards")
    @Operation(summary = "Get active rewards")
    public ResponseEntity<List<RewardDTO>> getRewards(Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(wheelService.getActiveRewards(user.getId()));
    }

    @GetMapping("/can-spin")
    @Operation(summary = "Check if user can spin today")
    public ResponseEntity<Map<String, Boolean>> canSpin(Authentication authentication) {
        User user = resolveUser(authentication);
        Map<String, Boolean> response = new HashMap<>();
        response.put("canSpin", wheelService.canSpinToday(user.getId()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    @Operation(summary = "Get spin history")
    public ResponseEntity<Page<SpinHistoryDTO>> getHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(wheelService.getUserSpinHistory(user.getId(), page, size));
    }

    @GetMapping("/unclaimed")
    @Operation(summary = "Get unclaimed rewards")
    public ResponseEntity<List<SpinHistoryDTO>> getUnclaimedRewards(Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(wheelService.getUnclaimedRewards(user.getId()));
    }

    @PostMapping("/claim/{spinId}")
    @Operation(summary = "Claim a reward")
    public ResponseEntity<Map<String, String>> claimReward(
            @PathVariable String spinId,
            Authentication authentication) {
        try {
            User user = resolveUser(authentication);
            org.bson.types.ObjectId spinObjectId = new org.bson.types.ObjectId(spinId);
            wheelService.claimReward(spinObjectId, user.getId());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Reward claimed successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Claim failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get statistics (Admin only)")
    public ResponseEntity<WheelStatsDTO> getStatistics() {
        return ResponseEntity.ok(wheelService.getStatistics());
    }
}
