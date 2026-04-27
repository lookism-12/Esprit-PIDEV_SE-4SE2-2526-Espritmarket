package esprit_market.controller.SAVController;

import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.service.CloudinaryService;
import esprit_market.service.SAVService.ISavFeedbackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/sav-feedbacks")
@RequiredArgsConstructor
@Tag(name = "SAV & Feedback Management", description = "Endpoints for managing customer complaints and feedbacks")
public class SavFeedbackController {

    private final ISavFeedbackService savFeedbackService;
    private final CloudinaryService cloudinaryService;

    // ─── JSON endpoint (kept for backward compatibility & admin use) ──────────

    @Operation(summary = "Submit Complaint/Feedback (JSON)", description = "Creates a feedback or SAV complaint linked to a purchased CartItem.")
    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<SavFeedbackResponseDTO> createFeedback(@Valid @RequestBody SavFeedbackRequestDTO request) {
        return new ResponseEntity<>(savFeedbackService.createFeedback(request), HttpStatus.CREATED);
    }

    // ─── Multipart endpoint (new – supports image upload) ────────────────────

    @Operation(summary = "Submit Complaint/Feedback with Image", description = "Creates a SAV complaint or feedback with an optional product image uploaded to Cloudinary.")
    @PostMapping(value = "/with-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<SavFeedbackResponseDTO> createFeedbackWithImage(
            @RequestParam("type") String type,
            @RequestParam("cartItemId") String cartItemId,
            @RequestParam("message") String message,
            @RequestParam(value = "rating", defaultValue = "3") int rating,
            @RequestParam(value = "reason", required = false) String reason,
            @RequestParam(value = "problemNature", required = false) String problemNature,
            @RequestParam(value = "priority", required = false) String priority,
            @RequestParam(value = "desiredSolution", required = false) String desiredSolution,
            @RequestParam(value = "positiveTags", required = false) List<String> positiveTags,
            @RequestParam(value = "recommendsProduct", required = false) Boolean recommendsProduct,
            @RequestPart(value = "image", required = false) MultipartFile image) {

        SavFeedbackRequestDTO request = new SavFeedbackRequestDTO();
        request.setType(type);
        request.setCartItemId(cartItemId);
        request.setMessage(message);
        request.setRating(rating);
        request.setReason(reason);
        request.setProblemNature(problemNature);
        request.setPriority(priority);
        request.setDesiredSolution(desiredSolution);
        request.setPositiveTags(positiveTags);
        request.setRecommendsProduct(recommendsProduct);
        request.setStatus("PENDING");

        if (image != null && !image.isEmpty()) {
            String imageUrl = cloudinaryService.upload(image, "sav");
            request.setImageUrls(List.of(imageUrl));
        }

        return new ResponseEntity<>(savFeedbackService.createFeedback(request), HttpStatus.CREATED);
    }

    // ─── Admin / shared read endpoints ───────────────────────────────────────

    @Operation(summary = "Get All Feedbacks/Complaints (FR-SAV2)")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getAllFeedbacks() {
        return ResponseEntity.ok(savFeedbackService.getAllFeedbacks());
    }

    @Operation(summary = "Get Feedback By ID (FR-SAV2)")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    public ResponseEntity<SavFeedbackResponseDTO> getFeedbackById(@PathVariable String id) {
        return ResponseEntity.ok(savFeedbackService.getFeedbackById(id));
    }

    @Operation(summary = "Get Feedbacks By CartItem (FR-SAV2)")
    @GetMapping("/cart-item/{cartItemId}")
    @PreAuthorize("hasAnyRole('ADMIN','CLIENT')")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getFeedbacksByCartItem(@PathVariable String cartItemId) {
        return ResponseEntity.ok(savFeedbackService.getFeedbacksByCartItem(cartItemId));
    }

    @Operation(summary = "Get Feedbacks By Product ID")
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getFeedbacksByProductId(@PathVariable String productId) {
        return ResponseEntity.ok(savFeedbackService.getFeedbacksByProductId(productId));
    }

    @Operation(summary = "Get Feedbacks By Type (SAV/FEEDBACK)")
    @GetMapping("/type/{type}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SavFeedbackResponseDTO>> getFeedbacksByType(@PathVariable String type) {
        return ResponseEntity.ok(savFeedbackService.getFeedbacksByType(type));
    }

    @Operation(summary = "Update Complaint/Feedback Information (FR-SAV3)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<SavFeedbackResponseDTO> updateFeedback(@PathVariable String id,
                                                                   @Valid @RequestBody SavFeedbackRequestDTO request) {
        return ResponseEntity.ok(savFeedbackService.updateFeedback(id, request));
    }

    @Operation(summary = "Update Complaint/Feedback Status Only (FR-SAV3)")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SavFeedbackResponseDTO> updateFeedbackStatus(@PathVariable String id,
                                                                         @RequestParam String status) {
        return ResponseEntity.ok(savFeedbackService.updateFeedbackStatus(id, status));
    }

    @Operation(summary = "Update Admin Response (FR-SAV3)")
    @PatchMapping("/{id}/admin-response")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SavFeedbackResponseDTO> updateAdminResponse(@PathVariable String id,
                                                                        @RequestParam String response) {
        return ResponseEntity.ok(savFeedbackService.updateFeedbackAdminResponse(id, response));
    }

    @Operation(summary = "Delete Feedback/Complaint (FR-SAV4)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Void> deleteFeedback(@PathVariable String id) {
        savFeedbackService.deleteFeedback(id);
        return ResponseEntity.noContent().build();
    }
}
