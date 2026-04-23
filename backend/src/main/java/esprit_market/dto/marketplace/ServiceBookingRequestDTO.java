package esprit_market.dto.marketplace;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * DTO for creating a new service booking
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceBookingRequestDTO {
    
    /**
     * Service ID to book
     */
    private String serviceId;
    
    /**
     * Booking date
     */
    private LocalDate bookingDate;
    
    /**
     * Start time of the booking
     */
    private LocalTime startTime;
    
    /**
     * Optional notes from customer
     */
    private String notes;
}
