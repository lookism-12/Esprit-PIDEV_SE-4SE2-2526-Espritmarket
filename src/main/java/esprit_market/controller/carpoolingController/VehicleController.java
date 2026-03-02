package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.VehicleRequestDTO;
import esprit_market.dto.carpooling.VehicleResponseDTO;
import esprit_market.entity.carpooling.Vehicle;
import esprit_market.service.carpoolingService.IVehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle Management", description = "APIs for managing vehicles")
public class VehicleController {

    private final IVehicleService vehicleService;

    @PostMapping
    @Operation(summary = "Create a new vehicle", description = "Creates a new vehicle for the authenticated driver")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicle created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT token required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - driver role required")
    })
    public VehicleResponseDTO create(@Valid @RequestBody VehicleRequestDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return vehicleService.createVehicle(dto, user.getUsername());
    }

    @GetMapping("/my")
    @Operation(summary = "Get my vehicles", description = "Retrieves all vehicles for the authenticated driver")
    public List<VehicleResponseDTO> getMyVehicles(@AuthenticationPrincipal UserDetails user) {
        return vehicleService.getMyVehicles(user.getUsername());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get vehicle by ID", description = "Retrieves a vehicle by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicle found"),
            @ApiResponse(responseCode = "404", description = "Vehicle not found")
    })
    public VehicleResponseDTO getById(@PathVariable String id) {
        return vehicleService.findById(new ObjectId(id));
    }

    @GetMapping("/driver/{driverProfileId}")
    @Operation(summary = "Get vehicles by driver profile", description = "Retrieves all vehicles for a specific driver profile")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicles retrieved successfully")
    })
    public List<VehicleResponseDTO> getByDriverProfileId(@PathVariable String driverProfileId) {
        return vehicleService.findByDriverProfileId(new ObjectId(driverProfileId));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update vehicle", description = "Updates an existing vehicle")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicle updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input data"),
            @ApiResponse(responseCode = "404", description = "Vehicle not found")
    })
    public VehicleResponseDTO update(@PathVariable String id,
            @Valid @RequestBody VehicleRequestDTO dto,
            @AuthenticationPrincipal UserDetails user) {
        return vehicleService.updateVehicle(id, dto, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete vehicle", description = "Deletes a vehicle owned by the authenticated driver")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Vehicle deleted successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - valid JWT token required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - only vehicle owner can delete"),
            @ApiResponse(responseCode = "404", description = "Vehicle not found")
    })
    public void delete(@PathVariable String id, @AuthenticationPrincipal UserDetails user) {
        vehicleService.deleteVehicle(id, user.getUsername());
    }
}
