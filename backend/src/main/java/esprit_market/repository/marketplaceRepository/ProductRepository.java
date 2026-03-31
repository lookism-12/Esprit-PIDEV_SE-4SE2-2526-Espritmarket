package esprit_market.repository.marketplaceRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.marketplace.Product;
import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, ObjectId> {
    List<Product> findByShopIdIn(List<ObjectId> shopIds);
    List<Product> findByShopId(ObjectId shopId);
}
