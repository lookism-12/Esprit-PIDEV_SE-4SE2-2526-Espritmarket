package esprit_market.service.negociationService;

import esprit_market.entity.negociation.Negotiation;
import esprit_market.repository.negociationRepository.NegotiationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NegotiationService implements INegotiationService {
    private final NegotiationRepository repository;

    public List<Negotiation> findAll() {
        return repository.findAll();
    }
}
