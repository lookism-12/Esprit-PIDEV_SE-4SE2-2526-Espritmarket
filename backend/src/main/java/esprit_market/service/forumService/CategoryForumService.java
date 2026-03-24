package esprit_market.service.forumService;

import esprit_market.dto.forum.CategoryForumRequest;
import esprit_market.entity.forum.CategoryForum;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.CategoryForumRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryForumService implements ICategoryForumService {
    private final CategoryForumRepository repository;

    @Override
    public List<CategoryForum> findAll() {
        return repository.findAll();
    }

    @Override
    public CategoryForum findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public CategoryForum create(CategoryForumRequest dto) {
        CategoryForum entity = ForumMapper.toCategoryForum(dto);
        if (entity == null) return null;
        return repository.save(entity);
    }

    @Override
    public CategoryForum update(ObjectId id, CategoryForumRequest dto) {
        CategoryForum existing = repository.findById(id).orElse(null);
        if (existing == null || dto == null) return existing;
        if (dto.getName() != null) existing.setName(dto.getName());
        if (dto.getDescription() != null) existing.setDescription(dto.getDescription());
        return repository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
