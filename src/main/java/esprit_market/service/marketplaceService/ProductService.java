package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Product;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService implements IProductService {
    private final ProductRepository repository;

    @Override
    public List<Product> findAll() {
        return repository.findAll();
    }
    
    @Override
    public Product save(Product product) {
        return repository.save(product);
    }
    
    @Override
    public Product findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }
    
    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
