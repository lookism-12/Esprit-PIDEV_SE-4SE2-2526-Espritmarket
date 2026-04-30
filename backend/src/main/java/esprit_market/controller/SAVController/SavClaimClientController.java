package esprit_market.controller.SAVController;

import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.SAVService.SavFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Client-side SAV Claims Controller
 * Handles return requests and customer claims from the client perspective
 */
@RestController
@RequestMapping("/api/sav/claims")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SAV Claims - Client", description = "Client endpoints for managing return requests and SAV claims")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SavClaimClientController {

    private final SavFeedbackService savFeedbackService;
    private final UserRepository userRepository;

    private String resolveAuthenticatedUserId(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
        return user.getId().toHexString();
    }

    /**
     * Create a new SAV claim for a purchased product
     */
    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Create SAV claim", description = "Client creates a return request for a purchased product")
    public ResponseEntity<Map<String, Object>> createSavClaim(
            @Valid @RequestBody SavFeedbackRequestDTO request,
            Authentication authentication) {
        
        try {
            log.info("Client creating SAV claim for cartItemId: {}", request.getCartItemId());
            
            // Set user ID from authentication
            String userId = resolveAuthenticatedUserId(authentication);
            request.setUserId(userId);
            request.setType("SAV");
            if (request.getTargetType() == null || request.getTargetType().isBlank()) {
                request.setTargetType("PRODUCT");
            }
            
            SavFeedbackResponseDTO response = savFeedbackService.createFeedback(request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Your return request has been submitted successfully");
            result.put("claimId", response.getId());
            result.put("data", response);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
            
        } catch (Exception e) {
            log.error("Error creating SAV claim", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Get all SAV claims for the current client
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Get my SAV claims", description = "Retrieve all return requests for the current client")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getMySavClaims(Authentication authentication) {
        try {
            String userId = resolveAuthenticatedUserId(authentication);
            log.info("Fetching SAV claims for user: {}", userId);
            
            List<SavFeedbackResponseDTO> claims = savFeedbackService.getSavClaimsByUserId(userId);
            
            return ResponseEntity.ok(claims);
            
        } catch (Exception e) {
            log.error("Error fetching SAV claims", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get a specific SAV claim by ID
     */
    @GetMapping("/my/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Get SAV claim details", description = "Retrieve details of a specific return request")
    public ResponseEntity<SavFeedbackResponseDTO> getMySavClaimById(
            @Parameter(description = "Claim ID") @PathVariable String id,
            Authentication authentication) {
        
        try {
            SavFeedbackResponseDTO claim = savFeedbackService.getFeedbackById(id);
            
            // Verify ownership
            String userId = resolveAuthenticatedUserId(authentication);
            if (claim.getUserId() == null || !claim.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            return ResponseEntity.ok(claim);
            
        } catch (Exception e) {
            log.error("Error fetching SAV claim", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Update a SAV claim (only if status is PENDING)
     */
    @PutMapping("/my/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Update SAV claim", description = "Update a return request (only if status is PENDING)")
    public ResponseEntity<Map<String, Object>> updateMySavClaim(
            @PathVariable String id,
            @Valid @RequestBody SavFeedbackRequestDTO request,
            Authentication authentication) {
        
        try {
            SavFeedbackResponseDTO existing = savFeedbackService.getFeedbackById(id);
            
            // Verify ownership
            String userId = resolveAuthenticatedUserId(authentication);
            if (existing.getUserId() == null || !existing.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Only allow update if status is PENDING
            if (!"PENDING".equalsIgnoreCase(existing.getStatus())) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Cannot update a claim that is not in PENDING status");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            request.setUserId(userId);
            request.setType("SAV");
            if (request.getTargetType() == null || request.getTargetType().isBlank()) {
                request.setTargetType("PRODUCT");
            }
            SavFeedbackResponseDTO updated = savFeedbackService.updateFeedback(id, request);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Your return request has been updated");
            result.put("data", updated);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error updating SAV claim", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Delete a SAV claim (only if status is PENDING)
     */
    @DeleteMapping("/my/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Delete SAV claim", description = "Delete a return request (only if status is PENDING)")
    public ResponseEntity<Map<String, Object>> deleteMySavClaim(
            @PathVariable String id,
            Authentication authentication) {
        
        try {
            SavFeedbackResponseDTO existing = savFeedbackService.getFeedbackById(id);
            
            // Verify ownership
            String userId = resolveAuthenticatedUserId(authentication);
            if (existing.getUserId() == null || !existing.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Only allow deletion if status is PENDING
            if (!"PENDING".equalsIgnoreCase(existing.getStatus())) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Cannot delete a claim that is not in PENDING status");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }
            
            savFeedbackService.deleteFeedback(id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Your return request has been deleted");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error deleting SAV claim", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }
}
