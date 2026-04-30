package esprit_market.mappers.carpooling;

import esprit_market.dto.carpooling.BookingResponseDTO;
import esprit_market.entity.carpooling.Booking;
import esprit_market.entity.user.User;
import esprit_market.repository.carpoolingRepository.PassengerProfileRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookingMapper {

    private final PassengerProfileRepository passengerProfileRepository;
    private final UserRepository userRepository;

    public BookingResponseDTO toResponseDTO(Booking booking) {
        if (booking == null) return null;

        String passengerName = null;
        String passengerUserId = null;
        if (booking.getPassengerProfileId() != null) {
            var pp = passengerProfileRepository.findById(booking.getPassengerProfileId()).orElse(null);
            if (pp != null) {
                User user = userRepository.findById(pp.getUserId()).orElse(null);
                if (user != null) {
                    passengerName = user.getFirstName() + " " + user.getLastName();
                    passengerUserId = user.getId().toHexString();
                }
            }
        }

        return BookingResponseDTO.builder()
                .bookingId(booking.getId() != null ? booking.getId().toHexString() : null)
                .rideId(booking.getRideId() != null ? booking.getRideId().toHexString() : null)
                .passengerProfileId(booking.getPassengerProfileId() != null ? booking.getPassengerProfileId().toHexString() : null)
                .passengerName(passengerName)
                .numberOfSeats(booking.getNumberOfSeats())
                .pickupLocation(booking.getPickupLocation())
                .dropoffLocation(booking.getDropoffLocation())
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .createdAt(booking.getCreatedAt())
                .cancelledAt(booking.getCancelledAt())
                .passengerUserId(passengerUserId)
                .build();
    }
}
