package esprit_market.controller.cartController;

import esprit_market.entity.cart.CartItem;
import esprit_market.service.cartService.CartItemService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart-items")
@RequiredArgsConstructor
public class CartItemController {
    private final CartItemService service;

    @GetMapping
    public List<CartItem> findAll() { return service.findAll(); }

    @PostMapping
    public CartItem save(@RequestBody CartItem item) { return service.save(item); }

    @GetMapping("/{id}")
    public CartItem findById(@PathVariable String id) { return service.findById(new ObjectId(id)); }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable String id) { service.deleteById(new ObjectId(id)); }
}
