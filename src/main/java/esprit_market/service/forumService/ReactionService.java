package esprit_market.service.forumService;

import esprit_market.dto.forum.ReactionRequest;
import esprit_market.entity.forum.Reaction;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReactionService implements IReactionService {
    private final ReactionRepository repository;

    @Override
    public List<Reaction> findAll() {
        return repository.findAll();
    }

    @Override
    public Reaction findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Reaction create(ReactionRequest dto) {
        Reaction entity = ForumMapper.toReaction(dto);
        if (entity == null) return null;
        return repository.save(entity);
    }

    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
