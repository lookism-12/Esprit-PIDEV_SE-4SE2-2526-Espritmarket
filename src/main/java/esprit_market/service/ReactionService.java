package esprit_market.service;

import esprit_market.entity.Reaction;
import esprit_market.repository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReactionService {
    private final ReactionRepository repository;

    public List<Reaction> findAll() { return repository.findAll(); }
    public Reaction save(Reaction reaction) { return repository.save(reaction); }
    public Reaction findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
