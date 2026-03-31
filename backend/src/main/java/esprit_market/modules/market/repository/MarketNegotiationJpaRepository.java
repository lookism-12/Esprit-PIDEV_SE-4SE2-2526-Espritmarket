package esprit_market.modules.market.repository;

import esprit_market.modules.market.entity.Negotiation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MarketNegotiationJpaRepository extends JpaRepository<Negotiation, UUID> {
}
