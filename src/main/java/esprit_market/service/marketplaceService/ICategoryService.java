package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Category;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICategoryService {
    List<Category> findAll();

    Category findById(ObjectId id);

    Category create(Category category);

    Category update(ObjectId id, Category category);

    void deleteById(ObjectId id);
}
