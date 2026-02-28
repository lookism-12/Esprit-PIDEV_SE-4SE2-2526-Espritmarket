package esprit_market.service.cartService;

import esprit_market.dto.CartItemResponse;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICartItemService {
    List<CartItemResponse> findAll();

    CartItemResponse findById(ObjectId id);

    void deleteById(ObjectId id);
    
    List<CartItemResponse> findByCartId(ObjectId cartId);
    
    void deleteByCartId(ObjectId cartId);
}
