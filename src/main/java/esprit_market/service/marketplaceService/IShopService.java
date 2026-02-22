package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Shop;

import java.util.List;

public interface IShopService {
    List<Shop> findAll();
}
