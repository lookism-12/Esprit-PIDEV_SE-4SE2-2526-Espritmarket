package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Favoris;
import org.bson.types.ObjectId;

import java.util.List;

public interface IFavorisService {
    List<Favoris> findAll();

    Favoris save(Favoris favoris);

    Favoris findById(ObjectId id);

    void deleteById(ObjectId id);
}
