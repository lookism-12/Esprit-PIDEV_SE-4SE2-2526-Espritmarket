package esprit_market.dto.carpooling;

import esprit_market.Enum.carpoolingEnum.RideStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Ride Response DTO
 * Used for GET /api/rides endpoints
 * Transfers ride data from backend to frontend with denormalized driver/vehicle
 * info
 * 
 * Backend -> Frontend: Ride entity + DriverProfile + Vehicle (denormalized)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideResponseDTO {

    // ==================== Identity ====================
    /** MongoDB ObjectId (string representation) */
    private String rideId;

    // ==================== Driver Info ====================
    /** Reference to DriverProfile - denormalized for display */
    private String driverProfileId;
    private String driverName; // firstName + lastName
    private Float driverRating; // Average rating (0-5)

    // ==================== Vehicle Info ====================
    /** Reference to Vehicle */
    private String vehicleId;
    private String vehicleMake; // Brand (e.g., "Toyota")
    private String vehicleModel; // Model (e.g., "Corolla")

    // ==================== Location & Time ====================
    private String departureLocation;
    private String destinationLocation;
    private LocalDateTime departureTime; // ISO 8601

    // ==================== Capacity & Pricing ====================
    private Integer availableSeats; // Current available seats
    private Float pricePerSeat; // TND per passenger

    // ==================== Trip Details ====================
    private RideStatus status;
    private Integer estimatedDurationMinutes;

    // ==================== Booking & Payment Stats ====================
    private Integer totalSeats;
    private Integer bookedSeats;
    private Integer paidBookingsCount;

    // ==================== Driver Earnings ====================
    private Float estimatedEarnings; // Potential earnings: availableSeats * pricePerSeat

    // ==================== Timestamps ====================
    private LocalDateTime completedAt; // When ride finished (if completed)
}
