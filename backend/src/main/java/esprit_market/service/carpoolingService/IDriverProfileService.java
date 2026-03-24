package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.DriverProfileRequestDTO;
import esprit_market.dto.carpooling.DriverProfileResponseDTO;
import esprit_market.dto.carpooling.DriverStatsDTO;
import esprit_market.entity.carpooling.DriverProfile;
import org.bson.types.ObjectId;

import java.util.List;

public interface IDriverProfileService {
    List<DriverProfileResponseDTO> findAll();

    DriverProfileResponseDTO findById(ObjectId id);

    DriverProfileResponseDTO findByUserId(ObjectId userId);

    DriverProfile save(DriverProfile profile);

    DriverProfileResponseDTO update(ObjectId id, DriverProfile profile);

    void delete(ObjectId id);

    DriverProfileResponseDTO registerDriver(DriverProfileRequestDTO dto, String email);

    DriverProfileResponseDTO getMyProfile(String email);

    void verifyDriver(ObjectId id);

    DriverStatsDTO getDriverStats(ObjectId id);

    void incrementTotalRidesAndEarnings(ObjectId driverProfileId, float earnings);
}
