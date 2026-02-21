package esprit_market.service;

import esprit_market.entity.Ride;
import esprit_market.repository.RideRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RideService {
    private final RideRepository repository;

    public List<Ride> findAll() { return repository.findAll(); }
}
