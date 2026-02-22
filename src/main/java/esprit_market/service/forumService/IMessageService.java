package esprit_market.service.forumService;

import esprit_market.entity.forum.Message;

import java.util.List;

public interface IMessageService {
    List<Message> findAll();
}
