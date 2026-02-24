package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.ProductCategory;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.repository.marketplaceRepository.ProductCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductCategoryService implements IProductCategoryService {
    private final ProductCategoryRepository repository;

    @Override
    public List<ProductCategory> findAll() {
        return repository.findAll();
    }

    @Override
    public ProductCategory findById(ObjectId id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProductCategory not found with id: " + id));
    }

    @Override
    public ProductCategory create(ProductCategory productCategory) {
        return repository.save(productCategory);
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("ProductCategory not found with id: " + id);
        }
        repository.deleteById(id);
    }

    @Override
    public List<ProductCategory> findByProductId(ObjectId productId) {
        return repository.findByProductId(productId);
    }

    @Override
    public List<ProductCategory> findByCategoryId(ObjectId categoryId) {
        return repository.findByCategoryId(categoryId);
    }
}
