package esprit_market.modules.market.repository;

import esprit_market.modules.market.entity.MarketUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MarketUserJpaRepository extends JpaRepository<MarketUser, UUID> {
}
