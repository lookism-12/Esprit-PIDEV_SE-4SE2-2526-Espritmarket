package esprit_market.mappers.carpooling;

import esprit_market.dto.carpoolingDto.RidePaymentResponseDTO;
import esprit_market.entity.carpooling.RidePayment;
import org.springframework.stereotype.Component;

@Component
public class RidePaymentMapper {
    public RidePaymentResponseDTO toResponseDTO(RidePayment payment) {
        if (payment == null)
            return null;
        return RidePaymentResponseDTO.builder()
                .id(payment.getId() != null ? payment.getId().toHexString() : null)
                .bookingId(payment.getBookingId() != null ? payment.getBookingId().toHexString() : null)
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
