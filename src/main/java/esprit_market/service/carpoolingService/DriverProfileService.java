package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.DriverProfile;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverProfileService implements IDriverProfileService {
    private final DriverProfileRepository repository;

    public List<DriverProfile> findAll() {
        return repository.findAll();
    }
}
