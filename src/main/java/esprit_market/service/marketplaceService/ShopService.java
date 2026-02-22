package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Shop;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService implements IShopService {
    private final ShopRepository repository;

    public List<Shop> findAll() {
        return repository.findAll();
    }
}
