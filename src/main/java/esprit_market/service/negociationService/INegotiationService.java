package esprit_market.service.negociationService;

import esprit_market.entity.negociation.Negotiation;

import java.util.List;

public interface INegotiationService {
    List<Negotiation> findAll();
}
