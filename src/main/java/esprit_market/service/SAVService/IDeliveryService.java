package esprit_market.service.SAVService;

import esprit_market.entity.SAV.Delivery;
import org.bson.types.ObjectId;

import java.util.List;

public interface IDeliveryService {
    List<Delivery> findAll();

    Delivery save(Delivery delivery);

    Delivery findById(ObjectId id);

    void deleteById(ObjectId id);
}
