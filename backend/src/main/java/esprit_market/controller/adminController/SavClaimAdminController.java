package esprit_market.controller.adminController;

import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.service.SAVService.SavFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Admin-side SAV Claims Controller
 * Handles management of return requests and customer claims from the admin perspective
 */
@RestController
@RequestMapping("/api/admin/sav/claims")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "SAV Claims - Admin", description = "Admin endpoints for managing return requests and SAV claims")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SavClaimAdminController {

    private final SavFeedbackService savFeedbackService;

    /**
     * Get all SAV claims
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all SAV claims", description = "Retrieve all return requests and customer claims")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getAllSavClaims() {
        try {
            log.info("Admin fetching all SAV claims");
            List<SavFeedbackResponseDTO> claims = savFeedbackService.getFeedbacksByType("SAV");
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            log.error("Error fetching SAV claims", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get SAV claim by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get SAV claim details", description = "Retrieve details of a specific return request")
    public ResponseEntity<SavFeedbackResponseDTO> getSavClaimById(
            @Parameter(description = "Claim ID") @PathVariable String id) {
        
        try {
            SavFeedbackResponseDTO claim = savFeedbackService.getFeedbackById(id);
            return ResponseEntity.ok(claim);
        } catch (Exception e) {
            log.error("Error fetching SAV claim", e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    /**
     * Get SAV claims by status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get SAV claims by status", description = "Retrieve return requests filtered by status")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getSavClaimsByStatus(
            @Parameter(description = "Status: PENDING, INVESTIGATING, RESOLVED, REJECTED, ARCHIVED") 
            @PathVariable String status) {
        
        try {
            log.info("Admin fetching SAV claims with status: {}", status);
            List<SavFeedbackResponseDTO> claims = savFeedbackService.getSavClaimsByStatus(status);
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            log.error("Error fetching SAV claims by status", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get unread SAV claims
     */
    @GetMapping("/unread")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get unread SAV claims", description = "Retrieve return requests not yet read by admin")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getUnreadSavClaims() {
        try {
            log.info("Admin fetching unread SAV claims");
            // This would need a method in the service
            List<SavFeedbackResponseDTO> claims = savFeedbackService.getFeedbacksByType("SAV");
            claims.removeIf(c -> c.getReadByAdmin() != null && c.getReadByAdmin());
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            log.error("Error fetching unread SAV claims", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update SAV claim status
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update SAV claim status", description = "Change the status of a return request")
    public ResponseEntity<Map<String, Object>> updateClaimStatus(
            @PathVariable String id,
            @RequestParam String status) {
        
        try {
            log.info("Admin updating SAV claim {} status to: {}", id, status);
            
            SavFeedbackResponseDTO updated = savFeedbackService.updateFeedbackStatus(id, status);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Claim status updated successfully");
            result.put("data", updated);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error updating SAV claim status", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Send admin response to a SAV claim
     */
    @PutMapping("/{id}/response")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Send admin response", description = "Add admin response to a return request")
    public ResponseEntity<Map<String, Object>> sendAdminResponse(
            @PathVariable String id,
            @RequestParam String response) {
        
        try {
            log.info("Admin sending response to SAV claim: {}", id);
            
            SavFeedbackResponseDTO updated = savFeedbackService.updateFeedbackAdminResponse(id, response);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Response sent successfully");
            result.put("data", updated);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error sending admin response", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Update AI verification results
     */
    @PutMapping("/{id}/ai-verification")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update AI verification", description = "Update AI verification results for a return request")
    public ResponseEntity<Map<String, Object>> updateAiVerification(
            @PathVariable String id,
            @RequestParam Double similarityScore,
            @RequestParam String decision,
            @RequestParam(required = false) String recommendation) {
        
        try {
            log.info("Admin updating AI verification for SAV claim: {}", id);
            
            SavFeedbackResponseDTO updated = savFeedbackService.updateAiVerification(id, similarityScore, decision, recommendation);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "AI verification updated successfully");
            result.put("data", updated);
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error updating AI verification", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Delete a SAV claim
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete SAV claim", description = "Delete a return request")
    public ResponseEntity<Map<String, Object>> deleteClaim(@PathVariable String id) {
        try {
            log.info("Admin deleting SAV claim: {}", id);
            
            savFeedbackService.deleteFeedback(id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Claim deleted successfully");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            log.error("Error deleting SAV claim", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * Get AI verification cases (uncertain or with scores)
     */
    @GetMapping("/ai-verification/cases")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get AI verification cases", description = "Retrieve return requests with AI verification results")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getAiVerificationCases() {
        try {
            log.info("Admin fetching AI verification cases");
            List<SavFeedbackResponseDTO> claims = savFeedbackService.getFeedbacksByType("SAV");
            claims.removeIf(c -> c.getAiSimilarityScore() == null);
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            log.error("Error fetching AI verification cases", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}