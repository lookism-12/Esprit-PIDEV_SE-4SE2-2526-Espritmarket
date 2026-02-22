package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Category;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICategoryService {
    List<Category> findAll();

    Category save(Category category);

    Category findById(ObjectId id);

    void deleteById(ObjectId id);
}
