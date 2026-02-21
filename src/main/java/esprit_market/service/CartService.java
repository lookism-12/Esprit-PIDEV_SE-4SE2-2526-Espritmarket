package esprit_market.service;

import esprit_market.entity.Cart;
import esprit_market.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {
    private final CartRepository repository;

    public List<Cart> findAll() { return repository.findAll(); }
}
