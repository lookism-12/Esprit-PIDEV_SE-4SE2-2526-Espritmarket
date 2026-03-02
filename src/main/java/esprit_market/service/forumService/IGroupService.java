package esprit_market.service.forumService;

import esprit_market.dto.forum.GroupRequest;
import esprit_market.entity.forum.Group;
import org.bson.types.ObjectId;

import java.util.List;

public interface IGroupService {
    List<Group> findAll();
    Group findById(ObjectId id);
    Group create(GroupRequest dto);
    Group update(ObjectId id, GroupRequest dto);
    void deleteById(ObjectId id);
}
