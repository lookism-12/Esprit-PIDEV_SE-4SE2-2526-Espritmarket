package esprit_market.service.marketplaceService;

import esprit_market.entity.marketplace.Favoris;
import org.bson.types.ObjectId;

import java.util.List;

public interface IFavorisService {
    List<Favoris> findAll();

    Favoris create(Favoris favoris);

    List<Favoris> getByUserId(ObjectId userId);

    Favoris update(ObjectId id, Favoris favoris);

    void delete(ObjectId id);

    Favoris findById(ObjectId id);
}
