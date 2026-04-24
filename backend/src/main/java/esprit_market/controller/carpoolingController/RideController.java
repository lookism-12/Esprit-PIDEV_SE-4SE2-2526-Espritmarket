package esprit_market.controller.carpoolingController;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.dto.carpooling.RideRequestDTO;
import esprit_market.dto.carpooling.RideResponseDTO;
import esprit_market.dto.carpooling.RideSearchRequestDTO;
import esprit_market.entity.carpooling.Ride;
import esprit_market.service.carpoolingService.IRideService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/rides")
@RequiredArgsConstructor
@Tag(name = "Ride Management", description = "APIs for managing carpool rides")
public class RideController {

        private final IRideService rideService;

        @PostMapping
        @Operation(summary = "Create a new ride", description = "Creates a new carpool ride for the authenticated driver")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Ride created successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid input data"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT token required"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - driver role required")
        })
        public RideResponseDTO create(@Valid @RequestBody RideRequestDTO dto,
                        @AuthenticationPrincipal UserDetails user) {
                return rideService.createRide(dto, user.getUsername());
        }

        @GetMapping("/{id}")
        @Operation(summary = "Get ride by ID", description = "Retrieves a ride by its ID")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Ride found"),
                        @ApiResponse(responseCode = "404", description = "Ride not found")
        })
        public RideResponseDTO getById(@PathVariable String id) {
                RideResponseDTO ride = rideService.findById(new ObjectId(id));
                if (ride == null)
                        throw new IllegalArgumentException("Ride not found");
                return ride;
        }

        @GetMapping
        @Operation(summary = "Get rides with filters", description = "Retrieves rides with optional filters")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Rides retrieved successfully")
        })
        public List<RideResponseDTO> getAll(
                        @Parameter(description = "Departure location filter") @RequestParam(required = false) String departureLocation,
                        @Parameter(description = "Destination location filter") @RequestParam(required = false) String destinationLocation,
                        @Parameter(description = "Departure time filter (ISO format)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime departureTime,
                        @Parameter(description = "Available seats filter") @RequestParam(required = false) Integer availableSeats,
                        @Parameter(description = "Ride status filter") @RequestParam(required = false) RideStatus status,
                        @Parameter(description = "Posted after date filter") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime postedSince,
                        Pageable pageable) {
                return rideService.findByFilters(departureLocation, destinationLocation, departureTime,
                                availableSeats, status, postedSince, pageable);
        }

        @GetMapping("/driver/{driverUserId}")
        @Operation(summary = "Get rides by driver", description = "Retrieves all rides for a specific driver")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Rides retrieved successfully")
        })
        public List<RideResponseDTO> getByDriver(@PathVariable String driverUserId) {
                return rideService.findByDriverUserId(driverUserId);
        }

        @GetMapping("/my")
        @Operation(summary = "Get my rides", description = "Returns all rides created by the authenticated driver")
        public List<RideResponseDTO> getMyRides(@AuthenticationPrincipal UserDetails user) {
                return rideService.getMyRides(user.getUsername());
        }

        @PatchMapping("/{id}")
        @Operation(summary = "Update ride", description = "Updates an existing ride")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Ride updated successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid input data"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT token required"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - only ride owner can update"),
                        @ApiResponse(responseCode = "404", description = "Ride not found")
        })
        public RideResponseDTO update(@PathVariable String id,
                        @Valid @RequestBody RideRequestDTO dto,
                        @AuthenticationPrincipal UserDetails user) {
                return rideService.updateRide(id, dto, user.getUsername());
        }

        @PatchMapping("/{id}/status")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Ride status updated successfully"),
                        @ApiResponse(responseCode = "404", description = "Ride not found")
        })
        @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
        @Operation(summary = "Admin: Update ride status", description = "Allows administrators to manually override ride status")
        public RideResponseDTO updateStatus(@PathVariable String id,
                        @Parameter(description = "New ride status") @RequestParam RideStatus status) {
                return rideService.updateStatus(new ObjectId(id), status);
        }

        @DeleteMapping("/{id}")
        @Operation(summary = "Cancel ride", description = "Cancels a ride (soft delete)")
        @ApiResponses(value = {
                        @ApiResponse(responseCode = "200", description = "Ride cancelled successfully"),
                        @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT token required"),
                        @ApiResponse(responseCode = "403", description = "Forbidden - only ride owner can cancel"),
                        @ApiResponse(responseCode = "404", description = "Ride not found")
        })
        public void delete(@PathVariable String id, @AuthenticationPrincipal UserDetails user) {
                rideService.cancelRide(id, user.getUsername());
        }

        @GetMapping("/search")
        @Operation(summary = "Search rides", description = "Searches for available rides based on criteria")
        public List<RideResponseDTO> searchRides(@ModelAttribute RideSearchRequestDTO search) {
                return rideService.searchRides(
                                search.getDepartureLocation(),
                                search.getDestinationLocation(),
                                search.getDepartureTime(),
                                search.getRequestedSeats(),
                                search.getPostedSince());
        }
}
