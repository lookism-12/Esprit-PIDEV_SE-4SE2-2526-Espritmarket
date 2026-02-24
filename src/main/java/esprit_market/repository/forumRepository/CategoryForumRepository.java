package esprit_market.repository.forumRepository;

import esprit_market.entity.forum.CategoryForum;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryForumRepository extends MongoRepository<CategoryForum, ObjectId> {
}
