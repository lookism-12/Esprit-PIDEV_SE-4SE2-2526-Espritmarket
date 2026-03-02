package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.RideReviewRequestDTO;
import esprit_market.dto.carpooling.RideReviewResponseDTO;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.RideReview;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RideReviewRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.entity.user.User;
import esprit_market.entity.carpooling.Ride;
import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.mappers.carpooling.RideReviewMapper;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RideReviewService implements IRideReviewService {

    private final RideReviewRepository rideReviewRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final BookingRepository bookingRepository;
    private final RideReviewMapper rideReviewMapper;

    @Override
    public List<RideReviewResponseDTO> findAll() {
        return rideReviewRepository.findAll().stream()
                .map(rideReviewMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public RideReviewResponseDTO findById(ObjectId id) {
        return rideReviewMapper.toResponseDTO(rideReviewRepository.findById(id).orElse(null));
    }

    @Override
    public void deleteById(ObjectId id) {
        rideReviewRepository.deleteById(id);
    }

    @Override
    public List<RideReviewResponseDTO> findByRideId(ObjectId rideId) {
        return rideReviewRepository.findByRideId(rideId).stream()
                .map(rideReviewMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<RideReviewResponseDTO> findByReviewerId(ObjectId reviewerId) {
        return rideReviewRepository.findByReviewerId(reviewerId).stream()
                .map(rideReviewMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<RideReviewResponseDTO> findByRevieweeId(ObjectId revieweeId) {
        return rideReviewRepository.findByRevieweeId(revieweeId).stream()
                .map(rideReviewMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<RideReviewResponseDTO> findByRating(Integer rating) {
        return rideReviewRepository.findByRating(rating).stream()
                .map(rideReviewMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public RideReviewResponseDTO submitReview(RideReviewRequestDTO dto, String reviewerEmail) {
        User reviewer = userRepository.findByEmail(reviewerEmail)
                .orElseThrow(() -> new IllegalArgumentException("Reviewer not found"));

        ObjectId revieweeId = new ObjectId(dto.getRevieweeId());
        ObjectId rideId = new ObjectId(dto.getRideId());

        // Logic improvement: Self-review check
        if (reviewer.getId().equals(revieweeId)) {
            throw new IllegalStateException("You cannot review yourself");
        }

        // Logic improvement: Ride status check
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new IllegalArgumentException("Ride not found"));
        if (ride.getStatus() != RideStatus.COMPLETED) {
            throw new IllegalStateException("You can only review completed rides");
        }

        // Logic improvement: Booking eligibility check

        // Correct logic:
        // If reviewer is passenger, reviewee must be driver.
        // If reviewer is driver, reviewee must be a passenger who had a completed
        // booking.

        var reviewerPassengerProfile = passengerProfileRepository.findByUserId(reviewer.getId()).orElse(null);
        var reviewerDriverProfile = driverProfileRepository.findByUserId(reviewer.getId()).orElse(null);

        boolean eligible = false;
        if (reviewerPassengerProfile != null && ride.getDriverProfileId().equals(revieweeId)) {
            // Passenger reviewing driver
            eligible = bookingRepository.findByRideIdAndStatus(rideId, BookingStatus.COMPLETED).stream()
                    .anyMatch(b -> b.getPassengerProfileId().equals(reviewerPassengerProfile.getId()));
        } else if (reviewerDriverProfile != null && ride.getDriverProfileId().equals(reviewerDriverProfile.getId())) {
            // Driver reviewing passenger
            eligible = bookingRepository.findByRideIdAndStatus(rideId, BookingStatus.COMPLETED).stream()
                    .anyMatch(b -> b.getPassengerProfileId().equals(revieweeId));
        }

        if (!eligible) {
            throw new IllegalStateException("You are not eligible to review this user for this ride");
        }

        // Part 2: duplicate review check
        boolean exists = rideReviewRepository.findAll().stream()
                .anyMatch(r -> r.getRideId().equals(rideId) && r.getReviewerId().equals(reviewer.getId())
                        && r.getRevieweeId().equals(revieweeId));
        if (exists) {
            throw new IllegalStateException("You have already reviewed this user for this ride");
        }

        RideReview review = RideReview.builder()
                .rideId(rideId)
                .reviewerId(reviewer.getId())
                .revieweeId(revieweeId)
                .rating(dto.getRating())
                .comment(dto.getComment() != null ? dto.getComment() : "")
                .build();
        review = rideReviewRepository.save(review);
        recalculateAverageRating(revieweeId);
        return rideReviewMapper.toResponseDTO(review);
    }

    public List<RideReviewResponseDTO> findReceivedReviews(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return rideReviewRepository.findByRevieweeId(user.getId()).stream()
                .map(rideReviewMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    private void recalculateAverageRating(ObjectId revieweeId) {

        List<RideReview> reviews = rideReviewRepository.findByRevieweeId(revieweeId);
        if (reviews.isEmpty())
            return;

        float sum = (float) reviews.stream().mapToInt(RideReview::getRating).sum();
        float avg = sum / reviews.size();

        var driverProfile = driverProfileRepository.findByUserId(revieweeId).orElse(null);
        if (driverProfile != null) {
            driverProfile.setAverageRating(avg);
            driverProfileRepository.save(driverProfile);
        } else {
            var passengerProfile = passengerProfileRepository.findByUserId(revieweeId).orElse(null);
            if (passengerProfile != null) {
                passengerProfile.setAverageRating(avg);
                passengerProfileRepository.save(passengerProfile);
            }
        }
    }
}
