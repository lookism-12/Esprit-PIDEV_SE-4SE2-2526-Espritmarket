package esprit_market.service.forumService;

import esprit_market.entity.forum.Message;
import esprit_market.repository.forumRepository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService implements IMessageService {
    private final MessageRepository repository;

    public List<Message> findAll() {
        return repository.findAll();
    }
}
