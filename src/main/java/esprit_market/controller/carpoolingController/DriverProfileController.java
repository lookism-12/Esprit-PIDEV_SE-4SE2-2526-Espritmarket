package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.DriverProfileRequestDTO;
import esprit_market.dto.carpooling.DriverStatsDTO;
import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.entity.carpooling.Ride;
import esprit_market.entity.carpooling.Vehicle;
import esprit_market.service.carpoolingService.DriverProfileService;
import esprit_market.service.carpoolingService.RideService;
import esprit_market.service.carpoolingService.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/driver-profiles")
@RequiredArgsConstructor
@Tag(name = "Driver Profile", description = "APIs for managing driver profiles")
public class DriverProfileController {

    private final DriverProfileService service;
    private final RideService rideService;
    private final VehicleService vehicleService;
    private final esprit_market.repository.userRepository.UserRepository userRepository;

    @PostMapping
    public DriverProfile create(@Valid @RequestBody DriverProfileRequestDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return service.registerDriver(user.getUsername(), dto);
    }

    @GetMapping("/me")
    public DriverProfile getMyProfile(@AuthenticationPrincipal UserDetails user) {
        esprit_market.entity.user.User u = userRepository.findByEmail(user.getUsername()).orElseThrow();
        return service.findByUserId(u.getId());
    }

    @GetMapping("/{id}")
    public DriverProfile getById(@PathVariable String id) {
        return service.findById(new ObjectId(id));
    }

    @GetMapping("/user/{userId}")
    public DriverProfile getByUserId(@PathVariable String userId) {
        return service.findByUserId(new ObjectId(userId));
    }

    @GetMapping("/{driverProfileId}/vehicles")
    public List<Vehicle> getVehicles(@PathVariable String driverProfileId) {
        return vehicleService.findByDriverProfileId(new ObjectId(driverProfileId));
    }

    @GetMapping("/{driverProfileId}/rides")
    public List<Ride> getRides(@PathVariable String driverProfileId) {
        return rideService.findByDriverProfileId(new ObjectId(driverProfileId));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update driver profile", description = "Update own profile (owner) or any profile (admin)")
    public DriverProfile update(@PathVariable String id,
            @Valid @RequestBody DriverProfileRequestDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        ObjectId profileId = new ObjectId(id);
        DriverProfile existing = service.findById(profileId);
        if (existing == null)
            throw new IllegalArgumentException("Driver profile not found");

        // Only the owner or an ADMIN may update
        boolean isAdmin = SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            esprit_market.entity.user.User u = userRepository.findByEmail(user.getUsername()).orElseThrow();
            if (!existing.getUserId().equals(u.getId()))
                throw new org.springframework.security.access.AccessDeniedException(
                        "Only the owner or admin can update this profile");
        }

        DriverProfile profile = new DriverProfile();
        profile.setLicenseNumber(dto.getLicenseNumber());
        profile.setLicenseDocument(dto.getLicenseDocument());
        return service.update(profileId, profile);
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Verify driver", description = "Mark a driver profile as verified")
    public DriverProfile verify(@PathVariable String id) {
        service.verifyDriver(new ObjectId(id));
        return service.findById(new ObjectId(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: Delete driver profile", description = "Cascade-deletes a driver profile and associated data")
    public void delete(@PathVariable String id) {
        service.delete(new ObjectId(id));
    }

    @GetMapping("/{id}/stats")
    @Operation(summary = "Get driver stats", description = "Returns ride stats for a driver profile")
    public DriverStatsDTO getStats(@PathVariable String id) {
        return service.getDriverStats(new ObjectId(id));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: List all driver profiles")
    public List<DriverProfile> getAll() {
        return service.findAll();
    }

    @GetMapping("/unverified")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin: List unverified driver profiles")
    public List<DriverProfile> getUnverified() {
        return service.findAll().stream()
                .filter(d -> d.getIsVerified() == null || !d.getIsVerified())
                .toList();
    }
}
