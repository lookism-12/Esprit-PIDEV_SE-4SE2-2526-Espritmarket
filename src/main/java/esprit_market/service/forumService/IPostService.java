package esprit_market.service.forumService;

import esprit_market.dto.forum.CreatePostDto;
import esprit_market.dto.forum.UpdatePostDto;
import esprit_market.entity.forum.Post;
import org.bson.types.ObjectId;

import java.util.List;

public interface IPostService {
    List<Post> findAll();
    Post findById(ObjectId id);
    Post create(CreatePostDto dto);
    Post update(ObjectId id, UpdatePostDto dto);
    void deleteById(ObjectId id);
}
