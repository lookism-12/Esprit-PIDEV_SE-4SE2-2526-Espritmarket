package esprit_market.modules.market.repository;

import esprit_market.modules.market.entity.MarketProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MarketProductJpaRepository extends JpaRepository<MarketProduct, UUID> {
}
