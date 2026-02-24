package esprit_market.service.forumService;

import esprit_market.dto.forum.CreateCommentDto;
import esprit_market.dto.forum.UpdateCommentDto;
import esprit_market.entity.forum.Comment;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICommentService {
    List<Comment> findAll();
    Comment findById(ObjectId id);
    Comment create(CreateCommentDto dto);
    Comment update(ObjectId id, UpdateCommentDto dto);
    void deleteById(ObjectId id);
}
