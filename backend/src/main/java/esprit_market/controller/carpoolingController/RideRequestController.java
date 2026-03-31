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
@Tag(name = "Ride Request", description = "Uber-style APIs for managing passenger ride requests")
public class RideRequestController {

    private final IRideRequestService service;

    @PostMapping
    @Operation(summary = "Passenger: Create a custom ride request", description = "Broadcasts a need for a driver")
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
    @Operation(summary = "Driver: List available PENDING passenger requests globally")
    public List<RideRequestResponseDTO> getAvailableRequests() {
        return service.getAvailableRequests();
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Driver: Accept a passenger request", description = "Requires driver to specify their vehicleId to convert the request into an active Ride and Booking")
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

    @DeleteMapping("/{id}/admin")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Hard delete a ride request")
    public void deleteRequest(@PathVariable String id) {
        // Implementation for hard delete if repository supports it, or just cancel as admin
        service.cancelRequest(id, null);
    }

    @PatchMapping("/{id}/counter")
    @Operation(summary = "Driver: Counter a passenger's proposed price", description = "Allows drivers to suggest a different price for the requested journey")
    public RideRequestResponseDTO counterPrice(@PathVariable String id,
            @RequestParam Float price,
            @RequestParam(required = false) String note) {
        return service.counterPrice(id, price, note);
    }
}
