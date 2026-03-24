package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.VehicleRequestDTO;
import esprit_market.dto.carpooling.VehicleResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IVehicleService {
    List<VehicleResponseDTO> findAll();

    VehicleResponseDTO findById(ObjectId id);

    VehicleResponseDTO update(ObjectId id, esprit_market.entity.carpooling.Vehicle vehicle);

    void deleteById(ObjectId id);

    List<VehicleResponseDTO> findByDriverProfileId(ObjectId driverProfileId);

    VehicleResponseDTO createVehicle(VehicleRequestDTO dto, String driverEmail);

    List<VehicleResponseDTO> getMyVehicles(String driverEmail);

    VehicleResponseDTO updateVehicle(String vehicleId, VehicleRequestDTO dto, String driverEmail);

    void deleteVehicle(String vehicleId, String driverEmail);
}
