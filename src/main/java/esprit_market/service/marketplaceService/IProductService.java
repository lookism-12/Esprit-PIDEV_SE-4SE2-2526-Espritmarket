package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Product;
import org.bson.types.ObjectId;

import java.util.List;

public interface IProductService {
    List<Product> findAll();

    Product findById(ObjectId id);

    Product create(Product product);

    Product update(ObjectId id, Product product);

    void deleteById(ObjectId id);
}
