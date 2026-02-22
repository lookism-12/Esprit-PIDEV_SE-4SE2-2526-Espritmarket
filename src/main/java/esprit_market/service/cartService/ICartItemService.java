package esprit_market.service.cartService;

import esprit_market.entity.cart.CartItem;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICartItemService {
    List<CartItem> findAll();

    CartItem save(CartItem item);

    CartItem findById(ObjectId id);

    void deleteById(ObjectId id);
}
