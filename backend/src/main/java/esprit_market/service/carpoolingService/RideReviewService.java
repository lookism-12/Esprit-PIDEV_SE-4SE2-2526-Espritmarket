package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.carpooling.ReviewRequestDTO;
import esprit_market.dto.carpooling.ReviewResponseDTO;
import esprit_market.entity.carpooling.*;
import esprit_market.entity.user.User;
import esprit_market.repository.carpoolingRepository.*;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RideReviewService {

    private final RideReviewRepository reviewRepository;
    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PassengerEngagementService engagementService;

    // ── Submit a review ───────────────────────────────────────────────────

    public ReviewResponseDTO addReview(ReviewRequestDTO dto) {
        User reviewer = getCurrentUser();
        ObjectId rideId = new ObjectId(dto.getRideId());

        // 1. Ride must exist and be COMPLETED or ACCEPTED
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new ResourceNotFoundException("Ride not found"));
        if (ride.getStatus() != RideStatus.COMPLETED && ride.getStatus() != RideStatus.ACCEPTED) {
            throw new IllegalStateException("You can only review a completed ride");
        }

        // 2. Determine reviewee (the other party)
        ObjectId revieweeUserId = resolveReviewee(reviewer, ride);

        // 3. Prevent duplicate review
        reviewRepository.findByRideIdAndReviewerId(rideId, reviewer.getId())
                .ifPresent(r -> { throw new IllegalStateException("You have already reviewed this ride"); });

        // 4. Save review
        RideReview unsavedReview = RideReview.builder()
                .rideId(rideId)
                .reviewerId(reviewer.getId())
                .revieweeId(revieweeUserId)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .build();
        final RideReview review = reviewRepository.save(unsavedReview);

        // 5. Update reviewee's average rating
        updateAverageRating(revieweeUserId);

        // 6. Award engagement points if the reviewer is a passenger
        passengerProfileRepository.findByUserId(reviewer.getId()).ifPresent(pp ->
            engagementService.awardFeedbackPoints(pp.getId())
        );

        // 7. Notify reviewee
        final String reviewerName = reviewer.getFirstName() + " " + reviewer.getLastName();
        final String ratingComment = dto.getComment();
        final int ratingValue = dto.getRating();
        userRepository.findById(revieweeUserId).ifPresent(reviewee ->
            notificationService.sendNotification(reviewee,
                    "⭐ New Review Received",
                    reviewerName + " gave you " + ratingValue + " star(s)"
                            + (ratingComment != null && !ratingComment.isBlank()
                            ? ": \"" + ratingComment + "\"" : ""),
                    NotificationType.INTERNAL_NOTIFICATION,
                    review.getId().toHexString())
        );

        log.info("Review {} saved: reviewer={} reviewee={} rating={}",
                review.getId(), reviewer.getId(), revieweeUserId, dto.getRating());

        return toDTO(review);
    }

    // ── Get reviews received by a user ────────────────────────────────────

    public List<ReviewResponseDTO> getReviewsByUser(String userId) {
        ObjectId id = new ObjectId(userId);
        return reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(id)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Get reviews for a specific ride ──────────────────────────────────

    public List<ReviewResponseDTO> getReviewsByRide(String rideId) {
        return reviewRepository.findByRideId(new ObjectId(rideId))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    // ── Check if current user can review a ride ───────────────────────────

    public boolean canReview(String rideId) {
        User user = getCurrentUser();
        ObjectId rid = new ObjectId(rideId);
        Ride ride = rideRepository.findById(rid).orElse(null);
        if (ride == null || (ride.getStatus() != RideStatus.COMPLETED && ride.getStatus() != RideStatus.ACCEPTED)) return false;
        boolean alreadyReviewed = reviewRepository.findByRideIdAndReviewerId(rid, user.getId()).isPresent();
        if (alreadyReviewed) return false;
        try {
            resolveReviewee(user, ride);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // ── Internal helpers ──────────────────────────────────────────────────

    /**
     * Determines who the reviewer is rating:
     * - If reviewer is the driver → they rate the passenger
     * - If reviewer is a passenger (has a booking) → they rate the driver
     */
    private ObjectId resolveReviewee(User reviewer, Ride ride) {
        // Check if reviewer is the driver
        DriverProfile driverProfile = driverProfileRepository.findByUserId(reviewer.getId()).orElse(null);
        if (driverProfile != null && driverProfile.getId().equals(ride.getDriverProfileId())) {
            // Reviewer is driver → find the passenger's userId from bookings
            List<Booking> completedBookings = bookingRepository.findByRideIdAndStatus(
                    ride.getId(), BookingStatus.COMPLETED);
            final List<Booking> bookings = completedBookings.isEmpty()
                    ? bookingRepository.findByRideId(ride.getId())
                    : completedBookings;
            if (bookings.isEmpty()) {
                throw new IllegalStateException("No passenger found for this ride");
            }
            Booking booking = bookings.get(0);
            PassengerProfile passengerProfile = passengerProfileRepository
                    .findById(booking.getPassengerProfileId())
                    .orElseThrow(() -> new ResourceNotFoundException("Passenger profile not found"));
            return passengerProfile.getUserId();
        }

        // Check if reviewer is a passenger on this ride
        PassengerProfile passengerProfile = passengerProfileRepository.findByUserId(reviewer.getId()).orElse(null);
        if (passengerProfile != null) {
            boolean hasBooking = bookingRepository.findByRideId(ride.getId())
                    .stream()
                    .anyMatch(b -> b.getPassengerProfileId().equals(passengerProfile.getId()));
            if (hasBooking) {
                // Reviewer is passenger → rate the driver
                DriverProfile dp = driverProfileRepository.findById(ride.getDriverProfileId())
                        .orElseThrow(() -> new ResourceNotFoundException("Driver profile not found"));
                return dp.getUserId();
            }
        }

        throw new IllegalStateException("You did not participate in this ride");
    }

    /**
     * Recalculates and persists the average rating for a user.
     * Also updates DriverProfile or PassengerProfile averageRating.
     */
    private void updateAverageRating(ObjectId userId) {
        List<RideReview> reviews = reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId);
        if (reviews.isEmpty()) return;

        double rawAvg = reviews.stream()
                .mapToInt(RideReview::getRating)
                .average()
                .orElse(0.0);
        // Round to 1 decimal — stored in a final variable so lambdas can capture it
        final double avg = Math.round(rawAvg * 10.0) / 10.0;
        final int totalReviews = reviews.size();

        // Update User
        userRepository.findById(userId).ifPresent(user -> {
            user.setAverageRating(avg);
            user.setTotalRatings(totalReviews);
            userRepository.save(user);
        });

        // Update DriverProfile if exists
        driverProfileRepository.findByUserId(userId).ifPresent(dp -> {
            dp.setAverageRating((float) avg);
            // Recompute badge
            dp.setBadge(computeBadge(avg));
            driverProfileRepository.save(dp);
        });

        // Update PassengerProfile if exists
        passengerProfileRepository.findByUserId(userId).ifPresent(pp -> {
            pp.setAverageRating((float) avg);
            passengerProfileRepository.save(pp);
        });

        log.info("Updated average rating for user {} → {}", userId, avg);
    }

    /** Badge tiers: GOLD ≥ 4.5 | SILVER ≥ 3.0 | BRONZE < 3.0 */
    public static String computeBadge(double avg) {
        if (avg >= 4.5) return "GOLD";
        if (avg >= 3.0) return "SILVER";
        return "BRONZE";
    }

    /** Badge label with emoji */
    public static String badgeLabel(double avg) {
        if (avg >= 4.5) return "⭐ Excellent Driver";
        if (avg >= 3.0) return "👍 Good Driver";
        return "⚠️ Needs Improvement";
    }

    private ReviewResponseDTO toDTO(RideReview review) {
        String reviewerName = "Unknown";
        String reviewerAvatar = null;
        String revieweeName = "Unknown";
        String badge = null;

        User reviewer = userRepository.findById(review.getReviewerId()).orElse(null);
        if (reviewer != null) {
            reviewerName = reviewer.getFirstName() + " " + reviewer.getLastName();
            reviewerAvatar = reviewer.getAvatarUrl();
        }

        User reviewee = userRepository.findById(review.getRevieweeId()).orElse(null);
        if (reviewee != null) {
            revieweeName = reviewee.getFirstName() + " " + reviewee.getLastName();
            badge = computeBadge(reviewee.getAverageRating());
        }

        return ReviewResponseDTO.builder()
                .id(review.getId().toHexString())
                .rideId(review.getRideId().toHexString())
                .reviewerId(review.getReviewerId().toHexString())
                .reviewerName(reviewerName)
                .reviewerAvatar(reviewerAvatar)
                .revieweeId(review.getRevieweeId().toHexString())
                .revieweeName(revieweeName)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .badge(badge)
                .build();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new IllegalStateException("Not authenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
