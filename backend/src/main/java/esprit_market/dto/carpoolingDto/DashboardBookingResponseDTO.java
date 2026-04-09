package esprit_market.dto.carpooling;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardBookingResponseDTO {
    private String bookingId;
    private String rideId;
    private String passengerName;
    private Integer seatsRequested;
    private String status;
}
