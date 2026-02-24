package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Shop;
import org.bson.types.ObjectId;

import java.util.List;

public interface IShopService {
    List<Shop> findAll();

    Shop findById(ObjectId id);

    Shop create(Shop shop);

    Shop update(ObjectId id, Shop shop);

    void deleteById(ObjectId id);
}
