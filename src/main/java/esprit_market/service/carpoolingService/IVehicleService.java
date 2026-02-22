package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.Vehicle;
import org.bson.types.ObjectId;

import java.util.List;

public interface IVehicleService {
    List<Vehicle> findAll();

    Vehicle save(Vehicle vehicle);

    Vehicle findById(ObjectId id);

    void deleteById(ObjectId id);
}
