package esprit_market.service.cartService;

import esprit_market.dto.cartDto.CartItemResponse;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICartItemService {
    List<CartItemResponse> findAll();

    CartItemResponse findById(ObjectId id);

    void deleteById(ObjectId id);
    
    List<CartItemResponse> findByCartId(ObjectId cartId);
    
    List<CartItemResponse> findOrderedItemsByUserId(ObjectId userId);
    
    void deleteByCartId(ObjectId cartId);
}
