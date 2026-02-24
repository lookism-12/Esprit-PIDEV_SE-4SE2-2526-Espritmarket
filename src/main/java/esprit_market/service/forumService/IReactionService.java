package esprit_market.service.forumService;

import esprit_market.dto.forum.CreateReactionDto;
import esprit_market.entity.forum.Reaction;
import org.bson.types.ObjectId;

import java.util.List;

public interface IReactionService {
    List<Reaction> findAll();
    Reaction findById(ObjectId id);
    Reaction create(CreateReactionDto dto);
    void deleteById(ObjectId id);
}
