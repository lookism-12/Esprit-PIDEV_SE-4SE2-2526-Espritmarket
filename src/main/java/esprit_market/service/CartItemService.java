package esprit_market.service;

import esprit_market.entity.CartItem;
import esprit_market.repository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartItemService {
    private final CartItemRepository repository;

    public List<CartItem> findAll() { return repository.findAll(); }
    public CartItem save(CartItem item) { return repository.save(item); }
    public CartItem findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
