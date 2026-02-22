package esprit_market.repository.marketplaceRepository;

import esprit_market.entity.marketplace.ServiceEntity;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceRepository extends MongoRepository<ServiceEntity, ObjectId> {
}
