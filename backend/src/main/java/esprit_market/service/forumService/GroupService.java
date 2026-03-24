package esprit_market.service.forumService;

import esprit_market.dto.forum.GroupRequest;
import esprit_market.entity.forum.Group;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService implements IGroupService {
    private static final int MIN_MEMBERS = 2;

    private final GroupRepository repository;

    @Override
    public List<Group> findAll() {
        return repository.findAll();
    }

    @Override
    public Group findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Group create(GroupRequest dto) {
        if (dto == null) return null;
        List<ObjectId> memberIds = ForumMapper.toObjectIdList(dto.getMemberIds());
        if (memberIds.size() < MIN_MEMBERS) {
            throw new IllegalArgumentException("Un groupe doit avoir au minimum " + MIN_MEMBERS + " personnes pour discuter.");
        }
        Group entity = ForumMapper.toGroup(dto);
        return repository.save(entity);
    }

    @Override
    public Group update(ObjectId id, GroupRequest dto) {
        Group existing = repository.findById(id).orElse(null);
        if (existing == null) return null;
        if (dto == null) return existing;
        if (dto.getName() != null) existing.setName(dto.getName());
        if (dto.getTopic() != null) existing.setTopic(dto.getTopic());
        if (dto.getLevel() != null) existing.setLevel(dto.getLevel());
        if (dto.getSpeciality() != null) existing.setSpeciality(dto.getSpeciality());
        if (dto.getMemberIds() != null) {
            List<ObjectId> memberIds = ForumMapper.toObjectIdList(dto.getMemberIds());
            if (memberIds.size() < MIN_MEMBERS) {
                throw new IllegalArgumentException("Un groupe doit avoir au minimum " + MIN_MEMBERS + " personnes pour discuter.");
            }
            existing.setMemberIds(memberIds);
        }
        return repository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
