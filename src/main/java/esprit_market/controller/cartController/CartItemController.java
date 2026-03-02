package esprit_market.controller.cartController;

import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.dto.cartDto.AddToCartRequest;
import esprit_market.dto.cartDto.UpdateCartItemRequest;
import esprit_market.service.cartService.ICartItemService;
import esprit_market.service.cartService.ICartService;
import esprit_market.service.cartService.AuthHelperService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/cart-items")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CLIENT')")
public class CartItemController {

    private final ICartItemService cartItemService;
    private final ICartService cartService;
    private final AuthHelperService authHelper;

    private ObjectId getUserId(Authentication authentication) {
        return authHelper.getUserIdFromAuthentication(authentication);
    }

    @GetMapping("/cart")
    public ResponseEntity<List<CartItemResponse>> getMyCartItems(Authentication authentication) {
        ObjectId userId = getUserId(authentication);
        String cartIdString = cartService.getOrCreateCart(userId).getId();
        ObjectId cartId = new ObjectId(cartIdString);
        List<CartItemResponse> items = cartItemService.findByCartId(cartId);
        return ResponseEntity.ok(items);
    }

    @PostMapping
    public ResponseEntity<CartItemResponse> addProductToCart(
            @Valid @RequestBody AddToCartRequest request,
            Authentication authentication) {

        ObjectId userId = getUserId(authentication);
        CartItemResponse item = cartService.addProductToCart(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    @PutMapping("/{cartItemId}")
    public ResponseEntity<CartItemResponse> updateCartItemQuantity(
            @PathVariable String cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request,
            Authentication authentication) {

        ObjectId userId = getUserId(authentication);
        CartItemResponse item = cartService.updateCartItemQuantity(userId, new ObjectId(cartItemId), request);
        return ResponseEntity.ok(item);
    }

    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<Void> removeCartItem(
            @PathVariable String cartItemId,
            Authentication authentication) {

        ObjectId userId = getUserId(authentication);
        cartItemService.deleteById(new ObjectId(cartItemId));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(Authentication authentication) {
        ObjectId userId = getUserId(authentication);
        String cartIdString = cartService.getOrCreateCart(userId).getId();
        ObjectId cartId = new ObjectId(cartIdString);
        cartItemService.deleteByCartId(cartId);
        return ResponseEntity.noContent().build();
    }
}