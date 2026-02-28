package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Product;
import org.bson.types.ObjectId;

import java.util.List;

public interface IProductService {
    List<Product> findAll();
    
    Product save(Product product);
    
    Product findById(ObjectId id);
    
    void deleteById(ObjectId id);
}
