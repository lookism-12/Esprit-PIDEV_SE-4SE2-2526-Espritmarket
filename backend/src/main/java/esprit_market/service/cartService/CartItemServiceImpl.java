package esprit_market.service.cartService;

import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.entity.cart.CartItem;
import esprit_market.mappers.cartMapper.CartItemMapper;
import esprit_market.repository.cartRepository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartItemServiceImpl implements ICartItemService {
    private final CartItemRepository repository;
    private final CartItemMapper mapper;

    @Override
    public List<CartItemResponse> findAll() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CartItemResponse findById(ObjectId id) {
        CartItem item = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        return mapper.toResponse(item);
    }

    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }

    @Override
    public List<CartItemResponse> findByCartId(ObjectId cartId) {
        return repository.findByCartId(cartId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByCartId(ObjectId cartId) {
        List<CartItem> items = repository.findByCartId(cartId);
        repository.deleteAll(items);
    }
}
