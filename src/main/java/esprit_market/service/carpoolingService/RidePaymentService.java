package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import esprit_market.entity.carpooling.RidePayment;
import esprit_market.repository.carpoolingRepository.RidePaymentRepository;
import esprit_market.Enum.carpoolingEnum.BookingStatus;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RidePaymentService implements IRidePaymentService {
    private final RidePaymentRepository repository;
    private final @Lazy IBookingService bookingService;

    @Override
    public List<RidePayment> findAll() {
        return repository.findAll();
    }

    @Override
    public RidePayment findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Optional<RidePayment> findByBookingId(ObjectId bookingId) {
        return repository.findByBookingId(bookingId);
    }

    @Override
    public List<RidePayment> findByStatus(PaymentStatus status) {
        return repository.findByStatus(status);
    }

    @Override
    @Transactional
    public RidePayment updateStatus(ObjectId id, PaymentStatus status) {
        RidePayment payment = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        payment.setStatus(status);
        payment = repository.save(payment);

        // Sync with Booking
        if (status == PaymentStatus.COMPLETED) {
            bookingService.updateStatus(payment.getBookingId(), BookingStatus.CONFIRMED);
        } else if (status == PaymentStatus.REFUNDED) {
            bookingService.updateStatus(payment.getBookingId(), BookingStatus.CANCELLED);
        }

        return payment;
    }
}
