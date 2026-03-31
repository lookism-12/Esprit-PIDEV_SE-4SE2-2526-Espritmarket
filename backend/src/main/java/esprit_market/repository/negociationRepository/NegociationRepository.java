package esprit_market.repository.negociationRepository;

import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.negociation.Negociation;
import esprit_market.Enum.negociationEnum.NegociationStatuts;
import esprit_market.entity.user.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NegociationRepository extends MongoRepository<Negociation, ObjectId> {

    List<Negociation> findByClient(User client);

    List<Negociation> findByService(ServiceEntity service);

    List<Negociation> findByProduct(esprit_market.entity.marketplace.Product product);

    List<Negociation> findByStatuts(NegociationStatuts statuts);

    List<Negociation> findByClientAndStatuts(User client, NegociationStatuts statuts);

    boolean existsByClientAndServiceAndStatuts(User client, ServiceEntity service, NegociationStatuts statuts);

    boolean existsByClientAndProductAndStatuts(User client, esprit_market.entity.marketplace.Product product, NegociationStatuts statuts);

    List<Negociation> findByProductIn(List<esprit_market.entity.marketplace.Product> products);

    List<Negociation> findByServiceIn(List<ServiceEntity> services);
}