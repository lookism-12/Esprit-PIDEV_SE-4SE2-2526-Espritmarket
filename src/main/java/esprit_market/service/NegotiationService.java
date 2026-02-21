package esprit_market.service;

import esprit_market.entity.Negotiation;
import esprit_market.repository.NegotiationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NegotiationService {
    private final NegotiationRepository repository;

    public List<Negotiation> findAll() { return repository.findAll(); }
}
