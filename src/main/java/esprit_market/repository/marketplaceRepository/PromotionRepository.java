package esprit_market.repository.marketplaceRepository;

import esprit_market.entity.marketplace.Promotion;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PromotionRepository extends MongoRepository<Promotion, ObjectId> {
    Optional<Promotion> findByTitle(String title);

    boolean existsByTitle(String title);
}
