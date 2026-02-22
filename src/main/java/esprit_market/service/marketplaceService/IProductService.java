package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Product;

import java.util.List;

public interface IProductService {
    List<Product> findAll();
}
