package esprit_market.service.forumService;

import esprit_market.dto.forum.CreateMessageDto;
import esprit_market.dto.forum.UpdateMessageDto;
import esprit_market.entity.forum.Message;
import org.bson.types.ObjectId;

import java.util.List;

public interface IMessageService {
    List<Message> findAll();
    Message findById(ObjectId id);
    Message create(CreateMessageDto dto);
    Message update(ObjectId id, UpdateMessageDto dto);
    void deleteById(ObjectId id);
}
