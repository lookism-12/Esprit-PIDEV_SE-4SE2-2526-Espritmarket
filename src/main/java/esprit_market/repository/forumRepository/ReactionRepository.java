package esprit_market.repository.forumRepository;

import esprit_market.entity.forum.Reaction;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReactionRepository extends MongoRepository<Reaction, ObjectId> {
    List<Reaction> findByPostId(ObjectId postId);
    List<Reaction> findByCommentId(ObjectId commentId);
}
