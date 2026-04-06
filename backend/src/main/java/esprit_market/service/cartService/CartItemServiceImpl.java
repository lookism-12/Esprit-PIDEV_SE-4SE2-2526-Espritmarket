package esprit_market.service.cartService;

import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.entity.cart.CartItem;
import esprit_market.mappers.cartMapper.CartItemMapper;
import esprit_market.repository.cartRepository.CartItemRepository;
import esprit_market.repository.cartRepository.CartRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartItemServiceImpl implements ICartItemService {
    private final CartItemRepository repository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
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
    public List<CartItemResponse> findOrderedItemsByUserId(ObjectId userId) {
        // Fetch the user object since the entity uses @DBRef user
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        // 1. Trouver tous les paniers de l'utilisateur qui ne sont pas en DRAFT
        // Utiliser findByUser au lieu de findByUserId pour la compatibilité @DBRef
        return cartRepository.findByUser(user).stream()
                .filter(cart -> cart.getStatus() != CartStatus.DRAFT)
                // 2. Récupérer tous les items de ces paniers
                .flatMap(cart -> repository.findByCartId(cart.getId()).stream())
                // 3. Mapper en Response
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteByCartId(ObjectId cartId) {
        List<CartItem> items = repository.findByCartId(cartId);
        repository.deleteAll(items);
    }
}
