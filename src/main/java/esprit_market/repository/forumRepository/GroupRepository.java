package esprit_market.repository.forumRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.forum.Group;

@Repository
public interface GroupRepository extends MongoRepository<Group, ObjectId> {
}
