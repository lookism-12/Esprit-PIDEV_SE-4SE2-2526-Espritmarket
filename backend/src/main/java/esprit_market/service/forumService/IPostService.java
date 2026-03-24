package esprit_market.service.forumService;

import esprit_market.dto.forum.PostRequest;
import esprit_market.entity.forum.Post;
import org.bson.types.ObjectId;

import java.util.List;

public interface IPostService {
    List<Post> findAll();
    Post findById(ObjectId id);
    Post create(PostRequest dto);
    Post update(ObjectId id, PostRequest dto);
    void deleteById(ObjectId id);
}
