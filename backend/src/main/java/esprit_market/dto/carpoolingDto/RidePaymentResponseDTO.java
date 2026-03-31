package esprit_market.dto.carpoolingDto;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RidePaymentResponseDTO {
    private String id;
    private String bookingId;
    private Float amount;
    private PaymentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
