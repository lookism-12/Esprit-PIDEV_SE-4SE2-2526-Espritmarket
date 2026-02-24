package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Category;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService implements ICategoryService {
    private final CategoryRepository repository;

    @Override
    public List<Category> findAll() {
        return repository.findAll();
    }

    @Override
    public Category findById(ObjectId id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
    }

    @Override
    public Category create(Category category) {
        return repository.save(category);
    }

    @Override
    public Category update(ObjectId id, Category categoryDetails) {
        Category existingCategory = findById(id);
        existingCategory.setName(categoryDetails.getName());
        return repository.save(existingCategory);
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
