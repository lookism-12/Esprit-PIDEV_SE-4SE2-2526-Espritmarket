package esprit_market.controller;

import esprit_market.entity.Cart;
import esprit_market.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/carts")
@RequiredArgsConstructor
public class CartController {
    private final CartService service;

    @GetMapping
    public List<Cart> getAll() { return service.findAll(); }
}
