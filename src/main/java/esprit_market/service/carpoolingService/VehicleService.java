package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.VehicleRequestDTO;
import esprit_market.dto.carpooling.VehicleResponseDTO;
import esprit_market.entity.carpooling.Vehicle;
import lombok.extern.slf4j.Slf4j;
import esprit_market.repository.carpoolingRepository.DriverProfileRepository;
import esprit_market.repository.carpoolingRepository.RideRepository;
import esprit_market.repository.carpoolingRepository.VehicleRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.Enum.carpoolingEnum.RideStatus;
import esprit_market.mappers.carpooling.VehicleMapper;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VehicleService implements IVehicleService {

    private final VehicleRepository vehicleRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final VehicleMapper vehicleMapper;

    @Override
    public List<esprit_market.dto.carpooling.VehicleResponseDTO> findAll() {
        return vehicleRepository.findAll().stream()
                .map(vehicleMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    public esprit_market.dto.carpooling.VehicleResponseDTO save(Vehicle vehicle) {
        return vehicleMapper.toResponseDTO(vehicleRepository.save(vehicle));
    }

    @Override
    public VehicleResponseDTO findById(ObjectId id) {
        return vehicleMapper.toResponseDTO(vehicleRepository.findById(id).orElse(null));
    }

    @Override
    public void deleteById(ObjectId id) {
        vehicleRepository.deleteById(id);
    }

    @Override
    public List<esprit_market.dto.carpooling.VehicleResponseDTO> findByDriverProfileId(ObjectId driverProfileId) {
        return vehicleRepository.findByDriverProfileId(driverProfileId).stream()
                .map(vehicleMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public esprit_market.dto.carpooling.VehicleResponseDTO update(ObjectId id, Vehicle vehicle) {
        Vehicle existing = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        if (vehicle.getMake() != null) {
            existing.setMake(vehicle.getMake());
        }
        if (vehicle.getModel() != null) {
            existing.setModel(vehicle.getModel());
        }
        if (vehicle.getLicensePlate() != null) {
            existing.setLicensePlate(vehicle.getLicensePlate());
        }
        if (vehicle.getNumberOfSeats() != null) {
            existing.setNumberOfSeats(vehicle.getNumberOfSeats());
        }
        return vehicleMapper.toResponseDTO(vehicleRepository.save(existing));
    }

    public VehicleResponseDTO createVehicle(VehicleRequestDTO dto, String driverEmail) {
        log.info("Creating vehicle for driver: {}", driverEmail);
        var user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        log.info("User found with ID: {}", user.getId());
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Driver profile not found (Register as driver first). User ID: " + user.getId()));
        log.info("Driver profile found with ID: {}", driverProfile.getId());

        Vehicle vehicle = Vehicle.builder()
                .driverProfileId(driverProfile.getId())
                .make(dto.getMake())
                .model(dto.getModel())
                .licensePlate(dto.getLicensePlate())
                .numberOfSeats(dto.getNumberOfSeats())
                .build();
        vehicle = vehicleRepository.save(vehicle);

        // Part 2: Track vehicle on DriverProfile
        if (driverProfile.getVehicleIds() == null) {
            driverProfile.setVehicleIds(new java.util.ArrayList<>());
        }
        driverProfile.getVehicleIds().add(vehicle.getId());
        driverProfileRepository.save(driverProfile);

        return vehicleMapper.toResponseDTO(vehicle);
    }

    public List<VehicleResponseDTO> getMyVehicles(String driverEmail) {
        var user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));
        return vehicleRepository.findByDriverProfileId(driverProfile.getId()).stream()
                .map(vehicleMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    public VehicleResponseDTO updateVehicle(String vehicleId, VehicleRequestDTO dto, String driverEmail) {
        ObjectId id = new ObjectId(vehicleId);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        var user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        if (!vehicle.getDriverProfileId().equals(driverProfile.getId())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Only the vehicle owner can update this vehicle");
        }

        if (dto.getMake() != null)
            vehicle.setMake(dto.getMake());
        if (dto.getModel() != null)
            vehicle.setModel(dto.getModel());
        if (dto.getLicensePlate() != null)
            vehicle.setLicensePlate(dto.getLicensePlate());
        if (dto.getNumberOfSeats() != null)
            vehicle.setNumberOfSeats(dto.getNumberOfSeats());

        return vehicleMapper.toResponseDTO(vehicleRepository.save(vehicle));
    }

    public void deleteVehicle(String vehicleId, String driverEmail) {
        ObjectId id = new ObjectId(vehicleId);
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        var user = userRepository.findByEmail(driverEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        var driverProfile = driverProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Driver profile not found"));

        if (!vehicle.getDriverProfileId().equals(driverProfile.getId())) {
            throw new AccessDeniedException("Only the vehicle owner can delete this vehicle");
        }

        // Part 4 #7: Block vehicle deletion if assigned to active rides
        boolean hasActiveRides = rideRepository.findByVehicleId(id).stream()
                .anyMatch(r -> r.getStatus() == RideStatus.PENDING ||
                        r.getStatus() == RideStatus.CONFIRMED ||
                        r.getStatus() == RideStatus.IN_PROGRESS);

        if (hasActiveRides) {
            throw new IllegalStateException(
                    "Cannot delete vehicle while it is assigned to active or pending rides. Cancel the rides first.");
        }

        // Part 2: Remove vehicle from DriverProfile
        if (driverProfile.getVehicleIds() != null) {
            driverProfile.getVehicleIds().remove(id);
            driverProfileRepository.save(driverProfile);
        }

        vehicleRepository.deleteById(id);
    }
}
