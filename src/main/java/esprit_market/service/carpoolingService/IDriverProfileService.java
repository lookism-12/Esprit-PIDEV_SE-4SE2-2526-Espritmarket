package esprit_market.service.carpoolingService;

import esprit_market.entity.carpooling.DriverProfile;

import java.util.List;

public interface IDriverProfileService {
    List<DriverProfile> findAll();
}
