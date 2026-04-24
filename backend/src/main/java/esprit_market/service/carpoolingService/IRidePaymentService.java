package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import esprit_market.dto.carpooling.RidePaymentResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;
import java.util.Optional;

public interface IRidePaymentService {
    List<RidePaymentResponseDTO> findAll();

    RidePaymentResponseDTO findById(ObjectId id);

    Optional<RidePaymentResponseDTO> findByBookingId(ObjectId bookingId);

    List<RidePaymentResponseDTO> findByStatus(PaymentStatus status);

    RidePaymentResponseDTO updateStatus(ObjectId id, PaymentStatus status);

    double getTotalCompletedRevenue();

    long countCompletedPayments();
    
    java.util.Map<String, Double> getMonthlyEarningsTrend();
}
