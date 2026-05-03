package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.BookingRequestDTO;
import esprit_market.dto.carpooling.BookingResponseDTO;
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

    BookingResponseDTO acceptBooking(ObjectId id, String driverEmail);

    BookingResponseDTO rejectBooking(ObjectId id, String driverEmail);

    void cancelBooking(String bookingId, String passengerEmail);

    BookingResponseDTO createBooking(BookingRequestDTO dto, String passengerEmail, ObjectId rideId);

    java.util.Map<String, Double> getMonthlyDemandTrend();
}
