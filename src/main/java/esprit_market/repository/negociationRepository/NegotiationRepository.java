package esprit_market.repository.negociationRepository;

import esprit_market.entity.negociation.Negotiation;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NegotiationRepository extends MongoRepository<Negotiation, ObjectId> {
}
