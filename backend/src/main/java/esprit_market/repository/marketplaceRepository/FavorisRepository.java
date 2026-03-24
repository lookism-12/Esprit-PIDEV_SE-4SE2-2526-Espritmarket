package esprit_market.repository.marketplaceRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.marketplace.Favoris;

@Repository
public interface FavorisRepository extends MongoRepository<Favoris, ObjectId> {
    java.util.List<Favoris> findByUserId(org.bson.types.ObjectId userId);
}
