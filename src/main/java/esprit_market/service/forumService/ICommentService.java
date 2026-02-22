package esprit_market.service.forumService;

import esprit_market.entity.forum.Comment;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICommentService {
    List<Comment> findAll();

    Comment save(Comment comment);

    Comment findById(ObjectId id);

    void deleteById(ObjectId id);
}
