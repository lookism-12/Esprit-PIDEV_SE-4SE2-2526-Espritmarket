package esprit_market.service.forumService;

import esprit_market.dto.forum.MessageRequest;
import esprit_market.dto.forum.MessageResponse;
import esprit_market.entity.forum.Message;
import org.bson.types.ObjectId;

import java.util.List;

public interface IMessageService {
    List<Message> findAll();
    Message findById(ObjectId id);
    Message create(MessageRequest dto);
    Message update(ObjectId id, MessageRequest dto);
    void deleteById(ObjectId id);
}
