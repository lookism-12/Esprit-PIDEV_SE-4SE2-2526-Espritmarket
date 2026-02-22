package esprit_market.service.forumService;

import esprit_market.entity.forum.Reply;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ReplyService implements IReplyService {

    public List<Reply> findAll() {
        return new ArrayList<>();
    }
}
