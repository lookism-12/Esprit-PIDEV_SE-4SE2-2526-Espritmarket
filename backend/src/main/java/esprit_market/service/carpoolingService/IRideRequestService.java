package esprit_market.service.carpoolingService;

import esprit_market.dto.carpooling.PassengerRideRequestCreationDTO;
import esprit_market.dto.carpooling.RideRequestResponseDTO;

import java.util.List;

public interface IRideRequestService {
    RideRequestResponseDTO createRequest(PassengerRideRequestCreationDTO dto, String passengerEmail);
    List<RideRequestResponseDTO> getMyRequests(String passengerEmail);
    List<RideRequestResponseDTO> getAvailableRequests();
    RideRequestResponseDTO acceptRequest(String requestId, String driverEmail, String vehicleId);
    void cancelRequest(String requestId, String passengerEmail);
    List<RideRequestResponseDTO> findAll();
    long countPendingRequests();
    RideRequestResponseDTO counterPrice(String requestId, Float price, String note);
}
