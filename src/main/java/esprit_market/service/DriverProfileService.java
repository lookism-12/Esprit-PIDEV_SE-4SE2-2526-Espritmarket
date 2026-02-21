package esprit_market.service;

import esprit_market.entity.DriverProfile;
import esprit_market.repository.DriverProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverProfileService {
    private final DriverProfileRepository repository;

    public List<DriverProfile> findAll() { return repository.findAll(); }
}
