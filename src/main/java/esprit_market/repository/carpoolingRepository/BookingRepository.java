package esprit_market.repository.carpoolingRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.carpooling.Booking;

@Repository
public interface BookingRepository extends MongoRepository<Booking, ObjectId> {
}
