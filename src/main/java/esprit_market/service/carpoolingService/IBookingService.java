package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.Booking;
import org.bson.types.ObjectId;

import java.util.List;

public interface IBookingService {
    List<Booking> findAll();

    Booking save(Booking booking);

    Booking findById(ObjectId id);

    void deleteById(ObjectId id);
}
