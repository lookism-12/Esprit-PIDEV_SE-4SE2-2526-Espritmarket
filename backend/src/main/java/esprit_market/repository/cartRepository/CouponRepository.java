package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.Coupons;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends MongoRepository<Coupons, ObjectId> {
    Optional<Coupons> findByCode(String code);
    
    boolean existsByCode(String code);
    
    List<Coupons> findByUserId(ObjectId userId);
    
    List<Coupons> findByActiveTrue();
    
    List<Coupons> findByActiveTrueAndExpirationDateAfter(LocalDate date);
    
    List<Coupons> findByEligibleUserLevel(String level);
}
