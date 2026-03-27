package esprit_market.repository.marketplaceRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.marketplace.Shop;

import java.util.Optional;

@Repository
public interface ShopRepository extends MongoRepository<Shop, ObjectId> {
    Optional<Shop> findByOwnerId(ObjectId ownerId);
}
