package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Product;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService implements IProductService {
    private final ProductRepository repository;

    public List<Product> findAll() {
        return repository.findAll();
    }
}
