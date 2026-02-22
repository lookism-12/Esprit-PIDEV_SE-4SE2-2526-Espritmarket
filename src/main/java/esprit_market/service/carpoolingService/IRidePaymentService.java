package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.RidePayment;
import org.bson.types.ObjectId;

import java.util.List;

public interface IRidePaymentService {
    List<RidePayment> findAll();

    RidePayment save(RidePayment payment);

    RidePayment findById(ObjectId id);

    void deleteById(ObjectId id);
}
