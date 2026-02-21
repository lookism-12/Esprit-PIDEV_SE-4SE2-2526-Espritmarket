package esprit_market.repository;

import esprit_market.entity.Favoris;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FavorisRepository extends MongoRepository<Favoris, ObjectId> {
}
