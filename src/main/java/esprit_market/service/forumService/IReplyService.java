package esprit_market.service.forumService;

import esprit_market.dto.forum.ReplyRequest;
import esprit_market.entity.forum.Reply;
import org.bson.types.ObjectId;

import java.util.List;

public interface IReplyService {
    List<Reply> findAll();
    Reply findById(ObjectId id);
    Reply create(ReplyRequest dto);
    Reply update(ObjectId id, ReplyRequest dto);
    void deleteById(ObjectId id);
}
