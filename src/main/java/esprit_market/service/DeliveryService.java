package esprit_market.service;

import esprit_market.entity.Delivery;
import esprit_market.repository.DeliveryRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DeliveryService {
    private final DeliveryRepository repository;

    public List<Delivery> findAll() { return repository.findAll(); }
    public Delivery save(Delivery delivery) { return repository.save(delivery); }
    public Delivery findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
