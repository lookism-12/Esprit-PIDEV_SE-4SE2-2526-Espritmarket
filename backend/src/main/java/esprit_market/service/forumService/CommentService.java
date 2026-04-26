package esprit_market.service.forumService;

import esprit_market.dto.forum.CommentRequest;
import esprit_market.entity.forum.Comment;
import esprit_market.mappers.ForumMapper;
import esprit_market.utils.HtmlSanitizer;
import esprit_market.repository.forumRepository.CommentRepository;
import esprit_market.repository.forumRepository.ReplyRepository;
import esprit_market.repository.forumRepository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService implements ICommentService {
    private final CommentRepository repository;
    private final ReplyRepository replyRepository;
    private final ReactionRepository reactionRepository;

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
        if (dto.getContent() != null) existing.setContent(HtmlSanitizer.sanitize(dto.getContent()));
        return repository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        Comment comment = repository.findById(id).orElse(null);
        if (comment == null) return;

        // Cascade delete: Delete all reactions for this comment
        reactionRepository.findByCommentId(id)
                .forEach(reaction -> reactionRepository.deleteById(reaction.getId()));

        // Cascade delete: Delete all replies for this comment
        replyRepository.findByCommentId(id)
                .forEach(reply -> replyRepository.deleteById(reply.getId()));

        repository.deleteById(id);
    }
}
