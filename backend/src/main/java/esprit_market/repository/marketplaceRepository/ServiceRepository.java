package esprit_market.repository.marketplaceRepository;

import esprit_market.entity.marketplace.ServiceEntity;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceRepository extends MongoRepository<ServiceEntity, ObjectId> {
    List<ServiceEntity> findByShopId(ObjectId shopId);
}
