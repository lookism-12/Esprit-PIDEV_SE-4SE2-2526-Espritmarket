package esprit_market.repository.forumRepository;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import esprit_market.entity.forum.Message;

@Repository
public interface MessageRepository extends MongoRepository<Message, ObjectId> {
}
