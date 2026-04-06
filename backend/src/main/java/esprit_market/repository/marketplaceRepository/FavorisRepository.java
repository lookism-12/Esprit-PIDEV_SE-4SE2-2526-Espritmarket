package esprit_market.repository.marketplaceRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.marketplace.Favoris;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavorisRepository extends MongoRepository<Favoris, ObjectId> {
    List<Favoris> findByUserId(ObjectId userId);
    Optional<Favoris> findByUserIdAndProductId(ObjectId userId, ObjectId productId);
    Optional<Favoris> findByUserIdAndServiceId(ObjectId userId, ObjectId serviceId);
}
