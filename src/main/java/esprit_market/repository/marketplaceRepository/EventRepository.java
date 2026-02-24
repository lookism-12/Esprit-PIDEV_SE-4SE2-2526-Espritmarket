package esprit_market.repository.marketplaceRepository;

import esprit_market.entity.marketplace.Event;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EventRepository extends MongoRepository<Event, ObjectId> {
    Optional<Event> findByName(String name);

    boolean existsByName(String name);
}
