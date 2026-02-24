package esprit_market.service.forumService;

import esprit_market.dto.forum.CreateMessageDto;
import esprit_market.dto.forum.UpdateMessageDto;
import esprit_market.entity.forum.Message;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService implements IMessageService {
    private final MessageRepository repository;

    @Override
    public List<Message> findAll() {
        return repository.findAll();
    }

    @Override
    public Message findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Message create(CreateMessageDto dto) {
        Message entity = ForumMapper.toMessage(dto);
        if (entity == null) return null;
        return repository.save(entity);
    }

    @Override
    public Message update(ObjectId id, UpdateMessageDto dto) {
        Message existing = repository.findById(id).orElse(null);
        if (existing == null || dto == null) return existing;
        if (dto.getContent() != null) existing.setContent(dto.getContent());
        return repository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
