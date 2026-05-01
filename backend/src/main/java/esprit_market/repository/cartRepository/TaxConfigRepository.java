package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.TaxConfig;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaxConfigRepository extends MongoRepository<TaxConfig, ObjectId> {

    /** Find the single default tax config */
    Optional<TaxConfig> findByIsDefaultTrue();

    /** All active tax configs */
    List<TaxConfig> findByActiveTrue();

    /** All configs ordered for admin list */
    List<TaxConfig> findAllByOrderByCreatedAtDesc();
}
