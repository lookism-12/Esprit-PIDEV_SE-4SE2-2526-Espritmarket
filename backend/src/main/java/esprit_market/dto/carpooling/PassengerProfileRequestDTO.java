package esprit_market.dto.carpooling;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Passenger Profile Request DTO
 * Used for POST /api/passenger-profiles endpoint
 * Transfers passenger registration and preferences from frontend to backend
 * 
 * Frontend -> Backend: Register as a passenger with optional preferences
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PassengerProfileRequestDTO {

    /** Optional preferences (e.g., preferred pickup/dropoff areas, music preference) */
    private String preferences;
}
