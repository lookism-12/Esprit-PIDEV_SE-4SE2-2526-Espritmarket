package esprit_market.controller.carpoolingController;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.Enum.carpoolingEnum.RideRequestStatus;
import esprit_market.Enum.userEnum.Role;
import esprit_market.dto.carpooling.BookingResponseDTO;
import esprit_market.dto.carpooling.PassengerDashboardDTO;
import esprit_market.dto.carpooling.RideRequestResponseDTO;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.entity.user.User;
import esprit_market.mappers.carpooling.BookingMapper;
import esprit_market.mappers.carpooling.RideRequestMapper;
import esprit_market.repository.carpoolingRepository.BookingRepository;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.carpoolingRepository.RideRequestRepository;
import esprit_market.repository.userRepository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/passenger")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Passenger Dashboard", description = "Passenger dashboard aggregated data")
public class PassengerDashboardController {

    private final UserRepository userRepository;
    private final PassengerProfileRepository passengerProfileRepository;
    private final BookingRepository bookingRepository;
    private final RideRequestRepository rideRequestRepository;
    private final BookingMapper bookingMapper;
    private final RideRequestMapper rideRequestMapper;

    @GetMapping("/dashboard")
    @Operation(summary = "Get passenger dashboard data")
    public PassengerDashboardDTO getDashboard(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        PassengerProfile profile = getOrCreateProfile(user);

        List<BookingResponseDTO> bookings = bookingRepository.findByPassengerProfileId(profile.getId())
                .stream().map(bookingMapper::toResponseDTO).collect(Collectors.toList());

        List<RideRequestResponseDTO> requests = rideRequestRepository.findByPassengerProfileId(profile.getId())
                .stream().map(rideRequestMapper::toResponseDTO).collect(Collectors.toList());

        float totalSpent = (float) bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.CONFIRMED)
                .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0).sum();

        long pending = requests.stream().filter(r -> r.getStatus() == RideRequestStatus.PENDING).count();
        long active = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.PENDING).count();

        List<BookingResponseDTO> recent = bookings.stream()
                .sorted((a, b) -> b.getCreatedAt() != null && a.getCreatedAt() != null
                        ? b.getCreatedAt().compareTo(a.getCreatedAt()) : 0)
                .limit(5).collect(Collectors.toList());

        return PassengerDashboardDTO.builder()
                .passengerName(user.getFirstName() + " " + user.getLastName())
                .averageRating(profile.getAverageRating() != null ? profile.getAverageRating() : 0f)
                .totalRidesCompleted(profile.getTotalRidesCompleted() != null ? profile.getTotalRidesCompleted() : 0)
                .totalSpent(totalSpent)
                .pendingRequests((int) pending)
                .activeBookings((int) active)
                .recentBookings(recent)
                .myRideRequests(requests)
                .build();
    }

    private PassengerProfile getOrCreateProfile(User user) {
        return passengerProfileRepository.findByUserId(user.getId()).orElseGet(() -> {
            log.info("Auto-creating passenger profile for user: {}", user.getEmail());
            PassengerProfile newProfile = PassengerProfile.builder()
                    .userId(user.getId()).averageRating(0f).totalRidesCompleted(0)
                    .preferences("").bookingIds(new ArrayList<>()).build();
            PassengerProfile saved = passengerProfileRepository.save(newProfile);
            try {
                User freshUser = userRepository.findById(user.getId()).orElse(user);
                freshUser.setPassengerProfileId(saved.getId());
                List<Role> roles = freshUser.getRoles() != null ? new ArrayList<>(freshUser.getRoles()) : new ArrayList<>();
                if (!roles.contains(Role.PASSENGER)) roles.add(Role.PASSENGER);
                freshUser.setRoles(roles);
                userRepository.save(freshUser);
            } catch (Exception e) {
                log.warn("Could not update user roles: {}", e.getMessage());
            }
            return saved;
        });
    }
}
