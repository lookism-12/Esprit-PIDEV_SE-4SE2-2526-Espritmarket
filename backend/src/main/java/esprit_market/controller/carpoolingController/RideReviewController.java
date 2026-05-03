package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.ReviewRequestDTO;
import esprit_market.dto.carpooling.ReviewResponseDTO;
import esprit_market.service.carpoolingService.RideReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ride-reviews")
@RequiredArgsConstructor
@Tag(name = "Ride Reviews", description = "Post-ride rating and feedback system")
public class RideReviewController {

    private final RideReviewService reviewService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Submit a review for a completed ride")
    public ReviewResponseDTO addReview(@Valid @RequestBody ReviewRequestDTO dto) {
        return reviewService.addReview(dto);
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get all reviews received by a user")
    public List<ReviewResponseDTO> getReviewsByUser(@PathVariable String userId) {
        return reviewService.getReviewsByUser(userId);
    }

    @GetMapping("/ride/{rideId}")
    @Operation(summary = "Get all reviews for a specific ride")
    public List<ReviewResponseDTO> getReviewsByRide(@PathVariable String rideId) {
        return reviewService.getReviewsByRide(rideId);
    }

    @GetMapping("/can-review/{rideId}")
    @Operation(summary = "Check if the current user can review a ride")
    public Map<String, Boolean> canReview(@PathVariable String rideId) {
        return Map.of("canReview", reviewService.canReview(rideId));
    }
}
