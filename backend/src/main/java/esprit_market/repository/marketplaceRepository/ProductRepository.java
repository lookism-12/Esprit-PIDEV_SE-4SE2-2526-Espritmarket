package esprit_market.repository.marketplaceRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import esprit_market.entity.marketplace.Product;
import esprit_market.Enum.marketplaceEnum.ProductStatus;

import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, ObjectId> {
    List<Product> findByShopId(ObjectId shopId);
    
    // Add method to find approved products directly
    List<Product> findByStatus(ProductStatus status);
    
    // Add method to find approved products with stock > 0
    @Query("{'status': ?0, 'stock': {$gt: 0}}")
    List<Product> findByStatusAndStockGreaterThan(ProductStatus status);
    
    // Add method to find all approved products
    @Query("{'status': 'APPROVED'}")
    List<Product> findAllApproved();
}
