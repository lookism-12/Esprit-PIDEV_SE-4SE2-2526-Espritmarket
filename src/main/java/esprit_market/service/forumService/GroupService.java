package esprit_market.service.forumService;

import esprit_market.entity.forum.Group;
import esprit_market.repository.forumRepository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService implements IGroupService {
    private final GroupRepository repository;

    public List<Group> findAll() {
        return repository.findAll();
    }
}
