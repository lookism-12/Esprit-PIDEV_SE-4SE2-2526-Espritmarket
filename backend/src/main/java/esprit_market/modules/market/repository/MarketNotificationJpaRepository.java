package esprit_market.modules.market.repository;

import esprit_market.modules.market.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MarketNotificationJpaRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdAndActiveTrueOrderByCreatedAtDesc(UUID userId);
}
