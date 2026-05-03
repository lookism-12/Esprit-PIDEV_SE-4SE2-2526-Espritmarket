package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.BookingResponseDTO;
import esprit_market.dto.carpooling.PassengerEngagementDTO;
import esprit_market.dto.carpooling.PassengerProfileRequestDTO;
import esprit_market.dto.carpooling.PassengerProfileResponseDTO;
import esprit_market.service.carpoolingService.IBookingService;
import esprit_market.service.carpoolingService.IPassengerProfileService;
import esprit_market.service.carpoolingService.PassengerEngagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/passenger-profiles")
@RequiredArgsConstructor
public class PassengerProfileController {

    private final IPassengerProfileService passengerProfileService;
    private final IBookingService bookingService;
    private final esprit_market.repository.userRepository.UserRepository userRepository;
    private final PassengerEngagementService engagementService;

    @PostMapping
    public PassengerProfileResponseDTO create(@Valid @RequestBody PassengerProfileRequestDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return passengerProfileService.registerPassenger(dto, user.getUsername());
    }

    @GetMapping("/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public List<PassengerProfileResponseDTO> getAll() {
        return passengerProfileService.findAll();
    }

    @GetMapping("/me")
    public PassengerProfileResponseDTO getMyProfile(@AuthenticationPrincipal UserDetails user) {
        return passengerProfileService.getMyProfile(user.getUsername());
    }

    @GetMapping("/{id}")
    public PassengerProfileResponseDTO getById(@PathVariable String id) {
        return passengerProfileService.findById(new ObjectId(id));
    }

    @GetMapping("/user/{userId}")
    public PassengerProfileResponseDTO getByUserId(@PathVariable String userId) {
        return passengerProfileService.findByUserId(new ObjectId(userId));
    }

    @GetMapping("/{id}/bookings")
    public List<BookingResponseDTO> getBookings(@PathVariable String id) {
        return bookingService.findByPassengerProfileId(new ObjectId(id));
    }

    @PatchMapping("/{id}")
    public PassengerProfileResponseDTO update(@PathVariable String id,
            @Valid @RequestBody PassengerProfileRequestDTO dto) {
        esprit_market.entity.carpooling.PassengerProfile profile = new esprit_market.entity.carpooling.PassengerProfile();
        profile.setPreferences(dto.getPreferences());
        return passengerProfileService.update(new ObjectId(id), profile);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) {
        passengerProfileService.delete(new ObjectId(id));
    }

    @GetMapping("/me/engagement")
    public PassengerEngagementDTO getMyEngagement(@AuthenticationPrincipal UserDetails user) {
        return engagementService.getEngagement(user.getUsername());
    }
}
