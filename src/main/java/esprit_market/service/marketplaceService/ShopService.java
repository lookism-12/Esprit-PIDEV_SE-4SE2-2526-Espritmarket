package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Shop;
import esprit_market.exception.ResourceNotFoundException;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService implements IShopService {
    private final ShopRepository repository;

    @Override
    public List<Shop> findAll() {
        return repository.findAll();
    }

    @Override
    public Shop findById(ObjectId id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
    }

    @Override
    public Shop create(Shop shop) {
        return repository.save(shop);
    }

    @Override
    public Shop update(ObjectId id, Shop shopDetails) {
        Shop existingShop = findById(id);
        existingShop.setOwnerId(shopDetails.getOwnerId());
        // IDs lists (productIds, serviceIds) are managed by the respective entities'
        // CRUD
        return repository.save(existingShop);
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Shop not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
