package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpoolingDto.RideReviewRequestDTO;
import esprit_market.dto.carpoolingDto.RideReviewResponseDTO;

import esprit_market.service.carpoolingService.IRideReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ride-reviews")
@RequiredArgsConstructor
public class RideReviewController {

    private final IRideReviewService rideReviewService;

    @PostMapping
    public RideReviewResponseDTO create(@Valid @RequestBody RideReviewRequestDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return rideReviewService.submitReview(dto, user.getUsername());
    }

    @GetMapping("/{id}")
    public RideReviewResponseDTO getById(@PathVariable String id) {
        return rideReviewService.findById(new ObjectId(id));
    }

    @GetMapping("/ride/{rideId}")
    public List<RideReviewResponseDTO> getByRideId(@PathVariable String rideId) {
        return rideReviewService.findByRideId(new ObjectId(rideId));
    }

    @GetMapping("/reviewer/{reviewerId}")
    public List<RideReviewResponseDTO> getByReviewerId(@PathVariable String reviewerId) {
        return rideReviewService.findByReviewerId(new ObjectId(reviewerId));
    }

    @GetMapping("/reviewee/{revieweeId}")
    public List<RideReviewResponseDTO> getByRevieweeId(@PathVariable String revieweeId) {
        return rideReviewService.findByRevieweeId(new ObjectId(revieweeId));
    }

    @GetMapping
    public List<RideReviewResponseDTO> getByRating(@RequestParam(required = false) Integer rating) {
        if (rating == null) {
            return rideReviewService.findAll();
        }
        return rideReviewService.findByRating(rating);
    }

    @GetMapping("/received")
    public List<RideReviewResponseDTO> getMyReceivedReviews(@AuthenticationPrincipal UserDetails user) {
        return rideReviewService.findReceivedReviews(user.getUsername());
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) {
        rideReviewService.deleteById(new ObjectId(id));
    }
}
