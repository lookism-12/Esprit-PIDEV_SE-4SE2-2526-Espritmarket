package esprit_market.modules.market.repository;

import esprit_market.modules.market.entity.Proposal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MarketProposalJpaRepository extends JpaRepository<Proposal, UUID> {
    List<Proposal> findByNegotiationIdOrderByCreatedAtAsc(UUID negotiationId);
}
