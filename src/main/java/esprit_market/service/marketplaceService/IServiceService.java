package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ServiceRequestDTO;
import esprit_market.dto.marketplace.ServiceResponseDTO;
import org.bson.types.ObjectId;

import java.util.List;

public interface IServiceService {
    List<ServiceResponseDTO> findAll();

    ServiceResponseDTO findById(ObjectId id);

    ServiceResponseDTO create(ServiceRequestDTO dto);

    ServiceResponseDTO update(ObjectId id, ServiceRequestDTO dto);

    void deleteById(ObjectId id);
}
