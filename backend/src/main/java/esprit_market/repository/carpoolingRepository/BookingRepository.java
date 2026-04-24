package esprit_market.repository.carpoolingRepository;

import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.entity.carpooling.Booking;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, ObjectId> {

    List<Booking> findByRideId(ObjectId rideId);

    List<Booking> findByPassengerProfileId(ObjectId passengerProfileId);

    List<Booking> findByRideIdAndStatus(ObjectId rideId, BookingStatus status);

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByRideIdIn(List<ObjectId> rideIds);

    @org.springframework.data.mongodb.repository.Aggregation(pipeline = {
        "{ $group: { _id: { $dateToString: { format: '%m', date: '$createdAt' } }, amount: { $sum: '$numberOfSeats' } } }",
        "{ $sort: { _id: 1 } }"
    })
    List<esprit_market.dto.carpooling.stats.AggregationAmountResult> getMonthlyDemandTrend();
}
