package esprit_market.repository.forumRepository;

import esprit_market.entity.forum.Reply;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReplyRepository extends MongoRepository<Reply, ObjectId> {
    List<Reply> findByCommentId(ObjectId commentId);
}
