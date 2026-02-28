package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.DriverProfile;
import org.bson.types.ObjectId;

import java.util.List;

public interface IDriverProfileService {
    List<DriverProfile> findAll();

    DriverProfile findById(ObjectId id);

    DriverProfile findByUserId(ObjectId userId);

    DriverProfile save(DriverProfile profile);

    DriverProfile update(ObjectId id, DriverProfile profile);

    void delete(ObjectId id);
}
