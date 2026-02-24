package esprit_market.service.forumService;

import esprit_market.dto.forum.CreateGroupDto;
import esprit_market.dto.forum.UpdateGroupDto;
import esprit_market.entity.forum.Group;
import org.bson.types.ObjectId;

import java.util.List;

public interface IGroupService {
    List<Group> findAll();
    Group findById(ObjectId id);
    Group create(CreateGroupDto dto);
    Group update(ObjectId id, UpdateGroupDto dto);
    void deleteById(ObjectId id);
}
