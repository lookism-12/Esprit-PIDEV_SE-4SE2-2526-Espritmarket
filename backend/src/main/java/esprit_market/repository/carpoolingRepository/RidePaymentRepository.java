package esprit_market.repository.carpoolingRepository;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import esprit_market.entity.carpooling.RidePayment;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RidePaymentRepository extends MongoRepository<RidePayment, ObjectId> {

    Optional<RidePayment> findByBookingId(ObjectId bookingId);

    List<RidePayment> findByBookingIdIn(List<ObjectId> bookingIds);

    List<RidePayment> findByStatus(PaymentStatus status);

    long countByStatus(PaymentStatus status);

    @org.springframework.data.mongodb.repository.Aggregation(pipeline = {
        "{ '$match': { 'status': 'COMPLETED' } }",
        "{ '$group': { '_id': null, 'total': { '$sum': '$amount' } } }"
    })
    Double sumCompletedPayments();
}
