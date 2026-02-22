package esprit_market.repository.cartRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.cart.Cart;

@Repository
public interface CartRepository extends MongoRepository<Cart, ObjectId> {
}
