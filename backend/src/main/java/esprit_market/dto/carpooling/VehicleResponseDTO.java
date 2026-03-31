package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Vehicle Response DTO
 * Used for GET /api/vehicles endpoints
 * Transfers vehicle data from backend to frontend
 * 
 * Backend -> Frontend: Vehicle entity
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleResponseDTO {
    /** MongoDB ObjectId (string representation) */
    private String id;
    /** Reference to DriverProfile */
    private String driverProfileId;
    /** Vehicle brand (e.g., "Toyota", "BMW") */
    private String make;
    /** Vehicle model (e.g., "Corolla", "X5") */
    private String model;
    /** Vehicle registration plate */
    private String licensePlate;
    /** Total seat capacity (1-7) */
    private Integer numberOfSeats;
    /** Creation timestamp */
    private LocalDateTime createdAt;
    /** Last update timestamp */
    private LocalDateTime updatedAt;
}
