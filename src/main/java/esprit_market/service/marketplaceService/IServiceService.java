package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.ServiceEntity;
import org.bson.types.ObjectId;

import java.util.List;

public interface IServiceService {
    List<ServiceEntity> findAll();

    ServiceEntity save(ServiceEntity service);

    ServiceEntity findById(ObjectId id);

    void deleteById(ObjectId id);
}
