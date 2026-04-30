package esprit_market.service.SAVService;

import esprit_market.dto.SAV.DeliveryRequestDTO;
import esprit_market.dto.SAV.DeliveryResponseDTO;
import java.util.List;

public interface IDeliveryService {
    // FR-DEL1
    DeliveryResponseDTO createDelivery(DeliveryRequestDTO request);
    // FR-DEL2
    DeliveryResponseDTO getDeliveryById(String id);
    List<DeliveryResponseDTO> getAllDeliveries();
    List<DeliveryResponseDTO> getDeliveriesByUser(String userId);
    List<DeliveryResponseDTO> getDriverWorklist(String driverId);
    List<DeliveryResponseDTO> getDeliveriesByCart(String cartId);
    List<DeliveryResponseDTO> getDeliveriesByStatus(String status);
    // FR-DEL3
    DeliveryResponseDTO updateDelivery(String id, DeliveryRequestDTO request);
    DeliveryResponseDTO updateDeliveryStatus(String id, String status);
    // FR-DEL4
    void deleteDelivery(String id);
    // FR-DEL5 — Driver assignment workflow
    DeliveryResponseDTO assignDriver(String deliveryId, String driverId);
    DeliveryResponseDTO respondToDelivery(String deliveryId, String driverId, boolean accepted, String declineReason);
    DeliveryResponseDTO markAsDelivered(String deliveryId, String driverId, String confirmationCode);
    DeliveryResponseDTO markAsReturned(String deliveryId, String driverId, String reason);
    List<DeliveryResponseDTO> getPendingForDriver(String driverId);
}

