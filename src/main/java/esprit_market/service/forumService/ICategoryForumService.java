package esprit_market.service.forumService;

import esprit_market.dto.forum.CreateCategoryForumDto;
import esprit_market.dto.forum.UpdateCategoryForumDto;
import esprit_market.entity.forum.CategoryForum;
import org.bson.types.ObjectId;

import java.util.List;

public interface ICategoryForumService {
    List<CategoryForum> findAll();
    CategoryForum findById(ObjectId id);
    CategoryForum create(CreateCategoryForumDto dto);
    CategoryForum update(ObjectId id, UpdateCategoryForumDto dto);
    void deleteById(ObjectId id);
}
