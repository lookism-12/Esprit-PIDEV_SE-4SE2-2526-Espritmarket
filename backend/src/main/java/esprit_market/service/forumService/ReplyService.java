package esprit_market.service.forumService;

import esprit_market.dto.forum.ReplyRequest;
import esprit_market.entity.forum.Reply;
import esprit_market.mappers.ForumMapper;
import esprit_market.utils.HtmlSanitizer;
import esprit_market.repository.forumRepository.ReplyRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReplyService implements IReplyService {
    private final ReplyRepository repository;

    @Override
    public List<Reply> findAll() {
        return repository.findAll();
    }

    @Override
    public Reply findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Reply create(ReplyRequest dto) {
        Reply entity = ForumMapper.toReply(dto);
        if (entity == null) return null;
        return repository.save(entity);
    }

    @Override
    public Reply update(ObjectId id, ReplyRequest dto) {
        Reply existing = repository.findById(id).orElse(null);
        if (existing == null || dto == null) return existing;
        if (dto.getContent() != null) existing.setContent(HtmlSanitizer.sanitize(dto.getContent()));
        return repository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
