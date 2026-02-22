package esprit_market.service.cartService;

import esprit_market.entity.cart.Cart;
import esprit_market.repository.cartRepository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService implements ICartService {
    private final CartRepository repository;

    public List<Cart> findAll() {
        return repository.findAll();
    }
}
