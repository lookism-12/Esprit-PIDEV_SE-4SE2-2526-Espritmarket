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
    List<DeliveryResponseDTO> getDeliveriesByCart(String cartId);
    // FR-DEL3
    DeliveryResponseDTO updateDelivery(String id, DeliveryRequestDTO request);
    DeliveryResponseDTO updateDeliveryStatus(String id, String status);
    // FR-DEL4
    void deleteDelivery(String id);
}
