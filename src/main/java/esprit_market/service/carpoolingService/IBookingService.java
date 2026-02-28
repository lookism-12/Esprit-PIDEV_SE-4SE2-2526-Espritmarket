package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.entity.carpooling.Booking;
import org.bson.types.ObjectId;

import java.util.List;

public interface IBookingService {
    List<Booking> findAll();

    Booking save(Booking booking);

    Booking findById(ObjectId id);

    Booking update(ObjectId id, Booking booking, ObjectId passengerProfileId);

    void deleteById(ObjectId id);

    List<Booking> findByRideId(ObjectId rideId);

    List<Booking> findByPassengerProfileId(ObjectId passengerProfileId);

    List<Booking> findByStatus(BookingStatus status);

    Booking updateStatus(ObjectId id, BookingStatus status);

    void cancelBooking(String bookingId, String passengerEmail, ObjectId passengerProfileId);

    esprit_market.dto.carpooling.BookingResponseDTO toResponseDTO(Booking booking);
}
