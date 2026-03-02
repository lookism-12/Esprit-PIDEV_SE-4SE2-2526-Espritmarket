package esprit_market.service.forumService;

import esprit_market.dto.forum.CommentRequest;
import esprit_market.entity.forum.Comment;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICommentService {
    List<Comment> findAll();
    Comment findById(ObjectId id);
    Comment create(CommentRequest dto);
    Comment update(ObjectId id, CommentRequest dto);
    void deleteById(ObjectId id);
}
