package esprit_market.repository.cartRepository;

import esprit_market.entity.cart.Discount;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DiscountRepository extends MongoRepository<Discount, ObjectId> {
    List<Discount> findByActiveTrue();
    
    List<Discount> findByStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate start, LocalDate end);
    
    List<Discount> findByAutoActivateTrue();
    
    List<Discount> findByCategoryIdsContaining(ObjectId categoryId);
    
    List<Discount> findByActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqual(LocalDate start, LocalDate end);
}