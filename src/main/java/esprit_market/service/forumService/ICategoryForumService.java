package esprit_market.service.forumService;

import esprit_market.dto.forum.CategoryForumRequest;
import esprit_market.entity.forum.CategoryForum;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICategoryForumService {
    List<CategoryForum> findAll();
    CategoryForum findById(ObjectId id);
    CategoryForum create(CategoryForumRequest dto);
    CategoryForum update(ObjectId id, CategoryForumRequest dto);
    void deleteById(ObjectId id);
}
