package esprit_market.controller.marketplaceController;

import esprit_market.entity.marketplace.Product;
import esprit_market.service.marketplaceService.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService service;

    @GetMapping
    public List<Product> getAll() { return service.findAll(); }
}
