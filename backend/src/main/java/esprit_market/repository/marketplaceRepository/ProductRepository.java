package esprit_market.repository.marketplaceRepository;

import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductStatus;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, ObjectId> {
    List<Product> findByStatus(ProductStatus status);

    List<Product> findByShopId(ObjectId shopId);
}
