package esprit_market.mappers.carpooling;

import esprit_market.dto.carpoolingDto.BookingResponseDTO;
import esprit_market.entity.carpooling.Booking;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public BookingResponseDTO toResponseDTO(Booking booking) {
        if (booking == null)
            return null;

        return BookingResponseDTO.builder()
                .bookingId(booking.getId() != null ? booking.getId().toHexString() : null)
                .rideId(booking.getRideId() != null ? booking.getRideId().toHexString() : null)
                .passengerProfileId(
                        booking.getPassengerProfileId() != null ? booking.getPassengerProfileId().toHexString() : null)
                .numberOfSeats(booking.getNumberOfSeats())
                .pickupLocation(booking.getPickupLocation())
                .dropoffLocation(booking.getDropoffLocation())
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getCreatedAt())
                .cancelledAt(booking.getCancelledAt())
                .build();
    }
}
