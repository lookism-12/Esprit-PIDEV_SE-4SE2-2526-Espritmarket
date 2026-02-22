package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.Ride;
import esprit_market.repository.carpoolingRepository.RideRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RideService implements IRideService {
    private final RideRepository repository;

    public List<Ride> findAll() {
        return repository.findAll();
    }
}
