package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.ServiceEntity;
import org.bson.types.ObjectId;

import java.util.List;

public interface IServiceService {
    List<ServiceEntity> findAll();

    ServiceEntity findById(ObjectId id);

    ServiceEntity create(ServiceEntity service);

    ServiceEntity update(ObjectId id, ServiceEntity service);

    void deleteById(ObjectId id);
}
