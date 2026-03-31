package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.dto.carpooling.RideReviewRequestDTO;
import esprit_market.dto.carpooling.RideReviewResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.carpooling.RideReview;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.RideReviewMapper;
import esprit_market.repository.carpoolingRepository.*;
import esprit_market.repository.userRepository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RideReviewServiceTest {

    @Mock RideReviewRepository rideReviewRepository;
    @Mock DriverProfileRepository driverProfileRepository;
    @Mock PassengerProfileRepository passengerProfileRepository;
    @Mock UserRepository userRepository;
    @Mock RideRepository rideRepository;
    @Mock BookingRepository bookingRepository;
    @Mock RideReviewMapper rideReviewMapper;

    @InjectMocks RideReviewService rideReviewService;

    private ObjectId passengerId, passengerProfileId, driverProfileId, rideId, reviewId;
    private User passengerUser;
    private PassengerProfile passengerProfile;
    private DriverProfile driverProfile;
    private Ride completedRide;
    private Booking completedBooking;
    private RideReview review;
    private RideReviewResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        passengerId        = new ObjectId();
        passengerProfileId = new ObjectId();
        driverProfileId    = new ObjectId();
        rideId             = new ObjectId();
        reviewId           = new ObjectId();

        passengerUser = User.builder().id(passengerId).email("passenger@test.com").build();

        passengerProfile = PassengerProfile.builder()
                .id(passengerProfileId).userId(passengerId).build();

        driverProfile = DriverProfile.builder()
                .id(driverProfileId).userId(new ObjectId()).averageRating(4f).build();

        completedRide = Ride.builder()
                .id(rideId).driverProfileId(driverProfileId)
                .status(RideStatus.COMPLETED).build();

        completedBooking = Booking.builder()
                .id(new ObjectId()).rideId(rideId)
                .passengerProfileId(passengerProfileId)
                .status(BookingStatus.COMPLETED).build();

        review = RideReview.builder()
                .id(reviewId).rideId(rideId)
                .reviewerId(passengerId).revieweeId(driverProfileId)
                .rating(5).comment("Great ride!").build();

        responseDTO = RideReviewResponseDTO.builder()
                .id(reviewId.toHexString()).rating(5).comment("Great ride!").build();
    }

    // ── submitReview ──────────────────────────────────────────────────────

    @Test
    @DisplayName("submitReview: passenger reviews driver successfully")
    void submitReview_passengerReviewsDriver() {
        RideReviewRequestDTO dto = RideReviewRequestDTO.builder()
                .rideId(rideId.toHexString())
                .revieweeId(driverProfileId.toHexString())
                .rating(5).comment("Great ride!").build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(completedRide));
        when(passengerProfileRepository.findByUserId(passengerId)).thenReturn(Optional.of(passengerProfile));
        when(driverProfileRepository.findByUserId(passengerId)).thenReturn(Optional.empty());
        when(bookingRepository.findByRideIdAndStatus(rideId, BookingStatus.COMPLETED))
                .thenReturn(List.of(completedBooking));
        when(rideReviewRepository.findAll()).thenReturn(List.of()); // no duplicate
        when(rideReviewRepository.save(any(RideReview.class))).thenReturn(review);
        when(rideReviewMapper.toResponseDTO(review)).thenReturn(responseDTO);
        // recalculate rating
        when(rideReviewRepository.findByRevieweeId(driverProfileId)).thenReturn(List.of(review));
        when(driverProfileRepository.findByUserId(driverProfileId)).thenReturn(Optional.of(driverProfile));

        RideReviewResponseDTO result = rideReviewService.submitReview(dto, "passenger@test.com");

        assertThat(result.getRating()).isEqualTo(5);
        verify(rideReviewRepository).save(any(RideReview.class));
    }

    @Test
    @DisplayName("submitReview: throws when ride is not completed")
    void submitReview_rideNotCompleted() {
        completedRide.setStatus(RideStatus.ACCEPTED);
        RideReviewRequestDTO dto = RideReviewRequestDTO.builder()
                .rideId(rideId.toHexString())
                .revieweeId(driverProfileId.toHexString())
                .rating(4).build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(completedRide));

        assertThatThrownBy(() -> rideReviewService.submitReview(dto, "passenger@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("only review completed rides");
    }

    @Test
    @DisplayName("submitReview: throws on self-review")
    void submitReview_selfReview() {
        RideReviewRequestDTO dto = RideReviewRequestDTO.builder()
                .rideId(rideId.toHexString())
                .revieweeId(passengerId.toHexString()) // same as reviewer
                .rating(5).build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));

        assertThatThrownBy(() -> rideReviewService.submitReview(dto, "passenger@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("cannot review yourself");
    }

    @Test
    @DisplayName("submitReview: throws on duplicate review")
    void submitReview_duplicate() {
        RideReviewRequestDTO dto = RideReviewRequestDTO.builder()
                .rideId(rideId.toHexString())
                .revieweeId(driverProfileId.toHexString())
                .rating(3).build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(completedRide));
        when(passengerProfileRepository.findByUserId(passengerId)).thenReturn(Optional.of(passengerProfile));
        when(driverProfileRepository.findByUserId(passengerId)).thenReturn(Optional.empty());
        when(bookingRepository.findByRideIdAndStatus(rideId, BookingStatus.COMPLETED))
                .thenReturn(List.of(completedBooking));
        // duplicate exists
        when(rideReviewRepository.findAll()).thenReturn(List.of(review));

        assertThatThrownBy(() -> rideReviewService.submitReview(dto, "passenger@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already reviewed");
    }

    @Test
    @DisplayName("submitReview: throws when passenger not eligible (no completed booking)")
    void submitReview_notEligible() {
        RideReviewRequestDTO dto = RideReviewRequestDTO.builder()
                .rideId(rideId.toHexString())
                .revieweeId(driverProfileId.toHexString())
                .rating(4).build();

        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));
        when(rideRepository.findById(rideId)).thenReturn(Optional.of(completedRide));
        when(passengerProfileRepository.findByUserId(passengerId)).thenReturn(Optional.of(passengerProfile));
        when(driverProfileRepository.findByUserId(passengerId)).thenReturn(Optional.empty());
        when(bookingRepository.findByRideIdAndStatus(rideId, BookingStatus.COMPLETED))
                .thenReturn(List.of()); // no completed booking

        assertThatThrownBy(() -> rideReviewService.submitReview(dto, "passenger@test.com"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not eligible");
    }

    // ── findReceivedReviews ───────────────────────────────────────────────

    @Test
    @DisplayName("findReceivedReviews: returns reviews for the given user")
    void findReceivedReviews_success() {
        when(userRepository.findByEmail("passenger@test.com")).thenReturn(Optional.of(passengerUser));
        when(rideReviewRepository.findByRevieweeId(passengerId)).thenReturn(List.of(review));
        when(rideReviewMapper.toResponseDTO(review)).thenReturn(responseDTO);

        List<RideReviewResponseDTO> result = rideReviewService.findReceivedReviews("passenger@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getRating()).isEqualTo(5);
    }

    // ── findByRideId ──────────────────────────────────────────────────────

    @Test
    @DisplayName("findByRideId: returns all reviews for a ride")
    void findByRideId_success() {
        when(rideReviewRepository.findByRideId(rideId)).thenReturn(List.of(review));
        when(rideReviewMapper.toResponseDTO(review)).thenReturn(responseDTO);

        List<RideReviewResponseDTO> result = rideReviewService.findByRideId(rideId);

        assertThat(result).hasSize(1);
    }
}
