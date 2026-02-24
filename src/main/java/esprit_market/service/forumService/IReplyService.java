package esprit_market.service.forumService;

import esprit_market.dto.forum.CreateReplyDto;
import esprit_market.dto.forum.UpdateReplyDto;
import esprit_market.entity.forum.Reply;
import org.bson.types.ObjectId;

import java.util.List;

public interface IReplyService {
    List<Reply> findAll();
    Reply findById(ObjectId id);
    Reply create(CreateReplyDto dto);
    Reply update(ObjectId id, UpdateReplyDto dto);
    void deleteById(ObjectId id);
}
