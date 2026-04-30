package esprit_market.repository.deliveryEtaRepository;

import esprit_market.entity.deliveryEta.AgentWrStats;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentWrStatsRepository extends MongoRepository<AgentWrStats, ObjectId> {
    Optional<AgentWrStats> findByAgentId(String agentId);
    List<AgentWrStats> findAllByFlaggedTrue();
    List<AgentWrStats> findAllByEliteTrue();
}
