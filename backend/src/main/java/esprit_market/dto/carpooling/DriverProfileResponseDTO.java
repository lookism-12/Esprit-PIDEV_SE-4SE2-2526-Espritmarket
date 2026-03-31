package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Driver Profile Response DTO
 * Used for GET /api/driver-profiles/me endpoint
 * Transfers driver verification, credentials, and statistics
 * 
 * Backend -> Frontend: DriverProfile entity + User denormalized data
 * 
 * Fields:
 * - id, userId: Identity
 * - fullName, email: User denormalized fields
 * - licenseNumber, licenseDocument: KYC credentials
 * - isVerified: Verification status
 * - averageRating: 0.0-5.0 rating from reviews
 * - totalRidesCompleted, totalEarnings: Driver statistics
 * - rideIds, vehicleIds: References to related entities
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverProfileResponseDTO {
    /** MongoDB ObjectId (string) */
    private String id;
    /** Reference to User */
    private String userId;
    /** User's full name (denormalized for display) */
    private String fullName;
    /** User's email (denormalized) */
    private String email;
    /** Driver's license number */
    private String licenseNumber;
    /** URL/path to uploaded license document */
    private String licenseDocument;
    /** KYC verification status */
    private Boolean isVerified;
    /** Average rating 0.0-5.0 from ride reviews */
    private Float averageRating;
    /** Total number of completed rides */
    private Integer totalRidesCompleted;
    /** Total earnings in TND */
    private Float totalEarnings;
    /** List of ride IDs created by this driver */
    private List<String> rideIds;
    /** List of vehicle IDs owned by this driver */
    private List<String> vehicleIds;
    /** Creation timestamp */
    private LocalDateTime createdAt;
    /** Last update timestamp */
    private LocalDateTime updatedAt;
}
