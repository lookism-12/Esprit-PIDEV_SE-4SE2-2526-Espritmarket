package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Passenger Profile Response DTO
 * Used for GET /api/passenger-profiles/me endpoint
 * Transfers passenger verification, preferences, and ride history
 * 
 * Backend -> Frontend: PassengerProfile entity + User denormalized data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerProfileResponseDTO {
    /** MongoDB ObjectId (string) */
    private String id;
    /** Reference to User */
    private String userId;
    /** User's full name (denormalized) */
    private String fullName;
    /** User's email (denormalized) */
    private String email;
    /** Average rating as passenger (0.0-5.0) */
    private Float averageRating;
    /** Passenger preferences (pickup/dropoff preferences, etc.) */
    private String preferences;
    /** List of booking IDs for this passenger */
    private List<String> bookingIds;
    /** Total number of rides completed as passenger */
    private Integer totalRidesCompleted;
    /** Creation timestamp */
    private LocalDateTime createdAt;
    /** Last update timestamp */
    private LocalDateTime updatedAt;
}
