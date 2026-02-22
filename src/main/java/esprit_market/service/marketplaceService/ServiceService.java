package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceService implements IServiceService {
    private final ServiceRepository repository;

    public List<ServiceEntity> findAll() {
        return repository.findAll();
    }

    public ServiceEntity save(ServiceEntity service) {
        return repository.save(service);
    }

    public ServiceEntity findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
