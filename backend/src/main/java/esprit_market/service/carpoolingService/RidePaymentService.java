package esprit_market.service.carpoolingService;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import esprit_market.dto.carpooling.RidePaymentResponseDTO;
import esprit_market.entity.carpooling.RidePayment;
import esprit_market.repository.carpoolingRepository.RidePaymentRepository;
import esprit_market.Enum.carpoolingEnum.BookingStatus;
import esprit_market.mappers.carpooling.RidePaymentMapper;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RidePaymentService implements IRidePaymentService {
    private final RidePaymentRepository repository;
    private final @Lazy IBookingService bookingService;
    private final RidePaymentMapper ridePaymentMapper;

    @Override
    public List<RidePaymentResponseDTO> findAll() {
        return repository.findAll().stream()
                .map(ridePaymentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public RidePaymentResponseDTO findById(ObjectId id) {
        return ridePaymentMapper.toResponseDTO(repository.findById(id).orElse(null));
    }

    @Override
    public Optional<RidePaymentResponseDTO> findByBookingId(ObjectId bookingId) {
        return repository.findByBookingId(bookingId)
                .map(ridePaymentMapper::toResponseDTO);
    }

    @Override
    public List<RidePaymentResponseDTO> findByStatus(PaymentStatus status) {
        return repository.findByStatus(status).stream()
                .map(ridePaymentMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RidePaymentResponseDTO updateStatus(ObjectId id, PaymentStatus status) {
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

        return ridePaymentMapper.toResponseDTO(payment);
    }

    @Override
    public double getTotalCompletedRevenue() {
        Double total = repository.sumCompletedPayments();
        return total != null ? total : 0.0;
    }

    @Override
    public long countCompletedPayments() {
        return repository.countByStatus(PaymentStatus.COMPLETED);
    }
}
