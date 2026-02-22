package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.Ride;

import java.util.List;

public interface IRideService {
    List<Ride> findAll();
}
