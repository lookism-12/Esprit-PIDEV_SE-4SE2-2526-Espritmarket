package esprit_market.service.forumService;

import esprit_market.dto.forum.PostRequest;
import esprit_market.entity.forum.Post;
import esprit_market.mappers.ForumMapper;
import esprit_market.utils.BadWordFilter;
import esprit_market.utils.HtmlSanitizer;
import esprit_market.repository.forumRepository.PostRepository;
import esprit_market.repository.forumRepository.CommentRepository;
import esprit_market.repository.forumRepository.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService implements IPostService {
    private final PostRepository repository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;

    @Override
    public List<Post> findAll() {
        return repository.findAll();
    }

    @Override
    public Post findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Post create(PostRequest dto) {
        Post entity = ForumMapper.toPost(dto);
        if (entity == null) return null;
        // Filter bad words before persisting
        entity.setContent(BadWordFilter.filter(entity.getContent()));
        return repository.save(entity);
    }

    @Override
    public Post update(ObjectId id, PostRequest dto) {
        Post existing = repository.findById(id).orElse(null);
        if (existing == null || dto == null) return existing;
        if (dto.getContent() != null)
            existing.setContent(BadWordFilter.filter(HtmlSanitizer.sanitize(dto.getContent())));
        if (dto.getPinned() != null) existing.setPinned(dto.getPinned());
        if (dto.getApproved() != null) existing.setApproved(dto.getApproved());
        return repository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        Post post = repository.findById(id).orElse(null);
        if (post == null) return;

        // Cascade delete: Delete all reactions for this post
        List<ObjectId> reactionIds = post.getReactionIds();
        if (reactionIds != null && !reactionIds.isEmpty()) {
            reactionIds.forEach(reactionRepository::deleteById);
        }

        // Cascade delete: Delete all comments and their reactions
        List<ObjectId> commentIds = post.getCommentIds();
        if (commentIds != null && !commentIds.isEmpty()) {
            commentIds.forEach(commentId -> {
                // Delete all reactions for each comment
                reactionRepository.findByCommentId(commentId)
                        .forEach(reaction -> reactionRepository.deleteById(reaction.getId()));
                // Delete the comment
                commentRepository.deleteById(commentId);
            });
        }

        repository.deleteById(id);
    }
}
