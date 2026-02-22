package esprit_market.service.cartService;

import esprit_market.entity.cart.Cart;

import java.util.List;

public interface ICartService {
    List<Cart> findAll();
}
