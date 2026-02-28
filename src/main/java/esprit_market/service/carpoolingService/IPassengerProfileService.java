package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.PassengerProfile;
import org.bson.types.ObjectId;

import java.util.List;

public interface IPassengerProfileService {
    List<PassengerProfile> findAll();

    PassengerProfile findById(ObjectId id);

    PassengerProfile findByUserId(ObjectId userId);

    PassengerProfile save(PassengerProfile profile);

    PassengerProfile update(ObjectId id, PassengerProfile profile);

    void delete(ObjectId id);
}
