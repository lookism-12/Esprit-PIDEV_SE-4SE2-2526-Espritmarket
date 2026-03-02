package esprit_market.service.forumService;

import esprit_market.dto.forum.CommentRequest;
import esprit_market.entity.forum.Comment;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService implements ICommentService {
    private final CommentRepository repository;

    @Override
    public List<Comment> findAll() {
        return repository.findAll();
    }

    @Override
    public Comment findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Comment create(CommentRequest dto) {
        Comment entity = ForumMapper.toComment(dto);
        if (entity == null) return null;
        return repository.save(entity);
    }

    @Override
    public Comment update(ObjectId id, CommentRequest dto) {
        Comment existing = repository.findById(id).orElse(null);
        if (existing == null || dto == null) return existing;
        if (dto.getContent() != null) existing.setContent(dto.getContent());
        return repository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
