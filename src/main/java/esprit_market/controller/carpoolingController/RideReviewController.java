package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.RideReviewRequestDTO;
import esprit_market.entity.carpooling.RideReview;
import esprit_market.service.carpoolingService.RideReviewService;
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

    private final RideReviewService rideReviewService;

    @PostMapping
    public RideReview create(@Valid @RequestBody RideReviewRequestDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return rideReviewService.submitReview(dto, user.getUsername());
    }

    @GetMapping("/{id}")
    public RideReview getById(@PathVariable String id) {
        return rideReviewService.findById(new ObjectId(id));
    }

    @GetMapping("/ride/{rideId}")
    public List<RideReview> getByRideId(@PathVariable String rideId) {
        return rideReviewService.findByRideId(new ObjectId(rideId));
    }

    @GetMapping("/reviewer/{reviewerId}")
    public List<RideReview> getByReviewerId(@PathVariable String reviewerId) {
        return rideReviewService.findByReviewerId(new ObjectId(reviewerId));
    }

    @GetMapping("/reviewee/{revieweeId}")
    public List<RideReview> getByRevieweeId(@PathVariable String revieweeId) {
        return rideReviewService.findByRevieweeId(new ObjectId(revieweeId));
    }

    @GetMapping
    public List<RideReview> getByRating(@RequestParam(required = false) Integer rating) {
        if (rating == null) {
            return rideReviewService.findAll();
        }
        return rideReviewService.findByRating(rating);
    }

    @GetMapping("/received")
    public List<RideReview> getMyReceivedReviews(@AuthenticationPrincipal UserDetails user) {
        return rideReviewService.findReceivedReviews(user.getUsername());
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) {
        rideReviewService.deleteById(new ObjectId(id));
    }
}
