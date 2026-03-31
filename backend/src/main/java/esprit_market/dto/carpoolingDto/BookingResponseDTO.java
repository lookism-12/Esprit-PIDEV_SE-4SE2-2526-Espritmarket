package esprit_market.dto.carpoolingDto;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponseDTO {

    private String bookingId;
    private String rideId;
    private String passengerProfileId;
    private Integer numberOfSeats;
    private String pickupLocation;
    private String dropoffLocation;
    private BookingStatus status;
    private Float totalPrice;
    private LocalDateTime createdAt;
    private LocalDateTime cancelledAt;
}
