package esprit_market.controller.SAVController;

import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.service.SAVService.ISavFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sav-feedbacks")
@RequiredArgsConstructor
@Tag(name = "SAV & Feedback Management", description = "Endpoints for managing customer complaints and feedbacks")
public class SavFeedbackController {

    private final ISavFeedbackService savFeedbackService;

    @Operation(summary = "Submit Complaint/Feedback (FR-SAV1)", description = "Creates a feedback or SAV complaint linked to a purchased CartItem.")
    @PostMapping
    public ResponseEntity<SavFeedbackResponseDTO> createFeedback(@Valid @RequestBody SavFeedbackRequestDTO request) {
        return new ResponseEntity<>(savFeedbackService.createFeedback(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Get All Feedbacks/Complaints (FR-SAV2)")
    @GetMapping
    public ResponseEntity<List<SavFeedbackResponseDTO>> getAllFeedbacks() {
        return ResponseEntity.ok(savFeedbackService.getAllFeedbacks());
    }

    @Operation(summary = "Get Feedback By ID (FR-SAV2)")
    @GetMapping("/{id}")
    public ResponseEntity<SavFeedbackResponseDTO> getFeedbackById(@PathVariable String id) {
        return ResponseEntity.ok(savFeedbackService.getFeedbackById(id));
    }

    @Operation(summary = "Get Feedbacks By CartItem (FR-SAV2)")
    @GetMapping("/cart-item/{cartItemId}")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getFeedbacksByCartItem(@PathVariable String cartItemId) {
        return ResponseEntity.ok(savFeedbackService.getFeedbacksByCartItem(cartItemId));
    }

    @Operation(summary = "Get Feedbacks By Type (SAV/FEEDBACK)")
    @GetMapping("/type/{type}")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getFeedbacksByType(@PathVariable String type) {
        return ResponseEntity.ok(savFeedbackService.getFeedbacksByType(type));
    }

    @Operation(summary = "Update Complaint/Feedback Information (FR-SAV3)")
    @PutMapping("/{id}")
    public ResponseEntity<SavFeedbackResponseDTO> updateFeedback(
            @PathVariable String id,
            @Valid @RequestBody SavFeedbackRequestDTO request) {
        return ResponseEntity.ok(savFeedbackService.updateFeedback(id, request));
    }

    @Operation(summary = "Update Complaint/Feedback Status Only (FR-SAV3)")
    @PatchMapping("/{id}/status")
    public ResponseEntity<SavFeedbackResponseDTO> updateFeedbackStatus(
            @PathVariable String id,
            @RequestParam String status) {
        return ResponseEntity.ok(savFeedbackService.updateFeedbackStatus(id, status));
    }

    @Operation(summary = "Delete Feedback/Complaint (FR-SAV4)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFeedback(@PathVariable String id) {
        savFeedbackService.deleteFeedback(id);
        return ResponseEntity.noContent().build();
    }
}
