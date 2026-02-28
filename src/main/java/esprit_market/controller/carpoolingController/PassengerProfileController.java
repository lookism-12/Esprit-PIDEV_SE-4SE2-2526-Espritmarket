package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.PassengerProfileRequestDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.carpooling.PassengerProfile;
import esprit_market.service.carpoolingService.BookingService;
import esprit_market.service.carpoolingService.PassengerProfileService;
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

    private final PassengerProfileService passengerProfileService;
    private final BookingService bookingService;
    private final esprit_market.repository.userRepository.UserRepository userRepository;

    @PostMapping
    public PassengerProfile create(@Valid @RequestBody PassengerProfileRequestDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return passengerProfileService.registerPassenger(user.getUsername(), dto);
    }

    @GetMapping("/me")
    public PassengerProfile getMyProfile(@AuthenticationPrincipal UserDetails user) {
        esprit_market.entity.user.User u = userRepository.findByEmail(user.getUsername()).orElseThrow();
        return passengerProfileService.findByUserId(u.getId());
    }

    @GetMapping("/{id}")
    public PassengerProfile getById(@PathVariable String id) {
        return passengerProfileService.findById(new ObjectId(id));
    }

    @GetMapping("/user/{userId}")
    public PassengerProfile getByUserId(@PathVariable String userId) {
        return passengerProfileService.findByUserId(new ObjectId(userId));
    }

    @GetMapping("/{id}/bookings")
    public List<Booking> getBookings(@PathVariable String id) {
        return bookingService.findByPassengerProfileId(new ObjectId(id));
    }

    @PatchMapping("/{id}")
    public PassengerProfile update(@PathVariable String id,
            @Valid @RequestBody PassengerProfileRequestDTO dto) {
        PassengerProfile profile = new PassengerProfile();
        profile.setPreferences(dto.getPreferences());
        return passengerProfileService.update(new ObjectId(id), profile);
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable String id) {
        passengerProfileService.delete(new ObjectId(id));
    }
}
