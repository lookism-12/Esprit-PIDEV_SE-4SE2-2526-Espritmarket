package esprit_market.repository.cartRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.cart.Discount;

@Repository
public interface DiscountRepository extends MongoRepository<Discount, ObjectId> {
}