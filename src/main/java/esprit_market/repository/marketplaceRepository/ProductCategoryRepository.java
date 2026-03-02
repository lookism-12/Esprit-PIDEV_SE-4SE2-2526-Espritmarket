package esprit_market.repository.marketplaceRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import esprit_market.entity.marketplace.ProductCategory;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductCategoryRepository extends MongoRepository<ProductCategory, ObjectId> {
    List<ProductCategory> findByProductId(ObjectId productId);

    List<ProductCategory> findByCategoryId(ObjectId categoryId);

    Optional<ProductCategory> findByProductIdAndCategoryId(ObjectId productId, ObjectId categoryId);

    void deleteByProductId(ObjectId productId);

    void deleteByCategoryId(ObjectId categoryId);

    void deleteByProductIdAndCategoryId(ObjectId productId, ObjectId categoryId);
}
