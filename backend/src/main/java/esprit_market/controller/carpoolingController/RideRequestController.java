package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.AcceptRideRequestDTO;
import esprit_market.dto.carpooling.PassengerRideRequestCreationDTO;
import esprit_market.dto.carpooling.RideRequestResponseDTO;
import esprit_market.service.carpoolingService.IRideRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ride-requests")
@RequiredArgsConstructor
@Tag(name = "Ride Request", description = "Passenger ride request management")
public class RideRequestController {

    private final IRideRequestService service;

    @PostMapping
    @Operation(summary = "Passenger: Create a ride request")
    public RideRequestResponseDTO createRequest(@Valid @RequestBody PassengerRideRequestCreationDTO dto,
                                                @AuthenticationPrincipal UserDetails user) {
        return service.createRequest(dto, user.getUsername());
    }

    @GetMapping("/my")
    @Operation(summary = "Passenger: List own requests")
    public List<RideRequestResponseDTO> getMyRequests(@AuthenticationPrincipal UserDetails user) {
        return service.getMyRequests(user.getUsername());
    }

    @GetMapping("/available")
    @Operation(summary = "Driver: List available PENDING requests")
    public List<RideRequestResponseDTO> getAvailableRequests() {
        return service.getAvailableRequests();
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Driver: Accept a passenger request")
    public RideRequestResponseDTO acceptRequest(@PathVariable String id,
                                                @Valid @RequestBody AcceptRideRequestDTO dto,
                                                @AuthenticationPrincipal UserDetails user) {
        return service.acceptRequest(id, user.getUsername(), dto.getVehicleId());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Passenger: Cancel own request")
    public void cancelRequest(@PathVariable String id, @AuthenticationPrincipal UserDetails user) {
        service.cancelRequest(id, user.getUsername());
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: List all ride requests")
    public List<RideRequestResponseDTO> getAllRequests() {
        return service.findAll();
    }

    @PatchMapping("/{id}/counter")
    @Operation(summary = "Driver: Counter a passenger's proposed price")
    public RideRequestResponseDTO counterPrice(@PathVariable String id,
                                               @RequestParam Float price,
                                               @RequestParam(required = false) String note) {
        return service.counterPrice(id, price, note);
    }
}
