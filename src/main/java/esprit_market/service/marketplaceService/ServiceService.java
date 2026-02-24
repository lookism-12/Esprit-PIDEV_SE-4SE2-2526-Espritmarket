package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceService implements IServiceService {
    private final ServiceRepository repository;
    private final ShopRepository shopRepository;

    @Override
    public List<ServiceEntity> findAll() {
        return repository.findAll();
    }

    @Override
    public ServiceEntity findById(ObjectId id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with id: " + id));
    }

    @Override
    public ServiceEntity create(ServiceEntity service) {
        // FR-PS1: Validate Shop existence
        if (service.getShopId() == null) {
            throw new IllegalArgumentException("Shop ID is mandatory");
        }
        if (!shopRepository.existsById(service.getShopId())) {
            throw new ResourceNotFoundException("Shop not found with id: " + service.getShopId());
        }

        // Save Service
        ServiceEntity savedService = repository.save(service);

        return savedService;
    }

    @Override
    public ServiceEntity update(ObjectId id, ServiceEntity serviceDetails) {
        ServiceEntity existingService = findById(id);

        existingService.setName(serviceDetails.getName());
        existingService.setDescription(serviceDetails.getDescription());
        existingService.setPrice(serviceDetails.getPrice());

        return repository.save(existingService);
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Service not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
