package esprit_market.service;

import esprit_market.entity.Group;
import esprit_market.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final GroupRepository repository;

    public List<Group> findAll() { return repository.findAll(); }
}
