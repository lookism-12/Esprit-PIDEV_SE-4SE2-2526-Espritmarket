package esprit_market.repository.negociationRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.negociation.Proposal;

@Repository
public interface ProposalRepository extends MongoRepository<Proposal, ObjectId> {
}