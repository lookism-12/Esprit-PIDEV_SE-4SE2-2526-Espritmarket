package esprit_market.service;

import esprit_market.entity.RidePayment;
import esprit_market.repository.RidePaymentRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RidePaymentService {
    private final RidePaymentRepository repository;

    public List<RidePayment> findAll() { return repository.findAll(); }
    public RidePayment save(RidePayment payment) { return repository.save(payment); }
    public RidePayment findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
