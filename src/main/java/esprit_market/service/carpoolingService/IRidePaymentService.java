package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import esprit_market.entity.carpooling.RidePayment;
import org.bson.types.ObjectId;

import java.util.List;
import java.util.Optional;

public interface IRidePaymentService {
    List<RidePayment> findAll();

    RidePayment findById(ObjectId id);

    Optional<RidePayment> findByBookingId(ObjectId bookingId);

    List<RidePayment> findByStatus(PaymentStatus status);

    RidePayment updateStatus(ObjectId id, PaymentStatus status);
}
