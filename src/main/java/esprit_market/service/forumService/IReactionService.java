package esprit_market.service.forumService;

import esprit_market.dto.forum.ReactionRequest;
import esprit_market.entity.forum.Reaction;
import org.bson.types.ObjectId;

import java.util.List;

public interface IReactionService {
    List<Reaction> findAll();
    Reaction findById(ObjectId id);
    Reaction create(ReactionRequest dto);
    void deleteById(ObjectId id);
}
