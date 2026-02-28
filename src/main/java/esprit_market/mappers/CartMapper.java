package esprit_market.mappers;

import esprit_market.dto.CartItemResponse;
import esprit_market.dto.CartResponse;
import esprit_market.entity.cart.Cart;
import esprit_market.entity.cart.CartItem;
import esprit_market.repository.cartRepository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class CartMapper {
    private final CartItemRepository cartItemRepository;
    private final CartItemMapper cartItemMapper;
    
    /**
     * Convert entity to Response DTO with computed fields.
     */
    public CartResponse toResponse(Cart cart) {
        if (cart == null) return null;
        
        List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
        List<CartItemResponse> itemResponses = items.stream()
            .map(cartItemMapper::toResponse)
            .collect(Collectors.toList());
        
        int totalItems = itemResponses.size();
        int totalQuantity = items.stream()
            .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
            .sum();
        boolean isEmpty = items.isEmpty();
        boolean hasDiscount = (cart.getAppliedCouponCode() != null || cart.getAppliedDiscountId() != null);
        double savingsAmount = cart.getDiscountAmount() != null ? cart.getDiscountAmount() : 0.0;
        
        return CartResponse.builder()
            .id(cart.getId() != null ? cart.getId().toHexString() : null)
            .userId(cart.getUserId() != null ? cart.getUserId().toHexString() : null)
            .creationDate(cart.getCreationDate())
            .lastUpdated(cart.getLastUpdated())
            .subtotal(cart.getSubtotal())
            .discountAmount(cart.getDiscountAmount())
            .taxAmount(cart.getTaxAmount())
            .total(cart.getTotal())
            .status(cart.getStatus())
            .items(itemResponses)
            .appliedCouponCode(cart.getAppliedCouponCode())
            .appliedDiscountId(cart.getAppliedDiscountId() != null ? 
                cart.getAppliedDiscountId().toHexString() : null)
            .shippingAddress(cart.getShippingAddress())
            .billingAddress(cart.getBillingAddress())
            .notes(cart.getNotes())
            .totalItems(totalItems)
            .totalQuantity(totalQuantity)
            .isEmpty(isEmpty)
            .hasDiscount(hasDiscount)
            .savingsAmount(savingsAmount)
            .build();
    }
}
