package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.ProductCategory;
import org.bson.types.ObjectId;
import java.util.List;

public interface IProductCategoryService {
    List<ProductCategory> findAll();

    ProductCategory findById(ObjectId id);

    ProductCategory create(ProductCategory productCategory);

    void deleteById(ObjectId id);

    List<ProductCategory> findByProductId(ObjectId productId);

    List<ProductCategory> findByCategoryId(ObjectId categoryId);
}
