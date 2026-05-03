package esprit_market.repository.gamification;

import esprit_market.entity.gamification.SpinHistory;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpinHistoryRepository extends MongoRepository<SpinHistory, ObjectId> {
    
    /**
     * Check if user has spun today
     */
    Optional<SpinHistory> findByUserIdAndSpinDate(ObjectId userId, LocalDate spinDate);
    
    /**
     * Get user's spin history
     */
    Page<SpinHistory> findByUserIdOrderBySpinTimestampDesc(ObjectId userId, Pageable pageable);
    
    /**
     * Get all spins by user
     */
    List<SpinHistory> findByUserId(ObjectId userId);
    
    /**
     * Count total spins
     */
    long countBySpinDate(LocalDate spinDate);
    
    /**
     * Get unclaimed rewards for a user
     */
    List<SpinHistory> findByUserIdAndClaimedFalseAndExpiryDateAfter(
        ObjectId userId, 
        java.time.LocalDateTime now
    );
}
