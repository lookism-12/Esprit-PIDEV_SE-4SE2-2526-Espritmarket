package esprit_market.service;

import esprit_market.entity.Vehicle;
import esprit_market.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VehicleService {
    private final VehicleRepository repository;

    public List<Vehicle> findAll() { return repository.findAll(); }
    public Vehicle save(Vehicle vehicle) { return repository.save(vehicle); }
    public Vehicle findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
