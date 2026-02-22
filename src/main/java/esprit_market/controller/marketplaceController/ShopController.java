package esprit_market.controller.marketplaceController;

import esprit_market.entity.marketplace.Shop;
import esprit_market.service.marketplaceService.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {
    private final ShopService service;

    @GetMapping
    public List<Shop> getAll() { return service.findAll(); }
}
