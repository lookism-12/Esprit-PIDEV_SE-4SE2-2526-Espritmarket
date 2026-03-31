package esprit_market.service.carpoolingService;

import esprit_market.dto.carpoolingDto.BookingRequestDTO;
import esprit_market.dto.carpoolingDto.BookingResponseDTO;
import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.entity.carpooling.Booking;
import org.bson.types.ObjectId;

import java.util.List;

public interface IBookingService {
    List<BookingResponseDTO> findAll();

    Booking save(esprit_market.entity.carpooling.Booking booking);

    BookingResponseDTO findById(ObjectId id);

    BookingResponseDTO update(ObjectId id, BookingRequestDTO dto, String passengerEmail);

    void deleteById(ObjectId id);

    List<BookingResponseDTO> findByRideId(ObjectId rideId);

    List<BookingResponseDTO> findByPassengerProfileId(ObjectId passengerProfileId);

    List<BookingResponseDTO> findByPassengerUserId(ObjectId userId);

    List<BookingResponseDTO> findMyBookings(String userEmail);

    List<BookingResponseDTO> findByStatus(BookingStatus status);

    BookingResponseDTO updateStatus(ObjectId id, BookingStatus status);

    void cancelBooking(String bookingId, String passengerEmail);

    BookingResponseDTO createBooking(BookingRequestDTO dto, String passengerEmail, ObjectId rideId);
}
