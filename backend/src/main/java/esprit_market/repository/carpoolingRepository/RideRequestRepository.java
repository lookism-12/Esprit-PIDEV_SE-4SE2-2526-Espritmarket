package esprit_market.repository.carpoolingRepository;

import esprit_market.Enum.carpoolingEnum.RideRequestStatus;
import esprit_market.entity.carpooling.RideRequest;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RideRequestRepository extends MongoRepository<RideRequest, ObjectId> {
    List<RideRequest> findByPassengerProfileId(ObjectId passengerProfileId);

    long countByStatus(RideRequestStatus status);

    List<RideRequest> findByStatusAndDepartureTimeAfter(RideRequestStatus status, LocalDateTime time);
}
