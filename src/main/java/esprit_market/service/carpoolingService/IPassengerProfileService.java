import esprit_market.dto.carpooling.PassengerProfileRequestDTO;
import esprit_market.dto.carpooling.PassengerProfileResponseDTO;
import esprit_market.entity.carpooling.PassengerProfile;
import org.bson.types.ObjectId;

import java.util.List;

public interface IPassengerProfileService {
    List<PassengerProfileResponseDTO> findAll();

    PassengerProfileResponseDTO findById(ObjectId id);

    PassengerProfileResponseDTO findByUserId(ObjectId userId);

    PassengerProfile save(PassengerProfile profile);

    PassengerProfileResponseDTO update(ObjectId id, PassengerProfile profile);

    void delete(ObjectId id);

    PassengerProfileResponseDTO registerPassenger(PassengerProfileRequestDTO dto, String email);

    PassengerProfileResponseDTO getMyProfile(String email);

    void incrementTotalRides(ObjectId passengerProfileId);
}
