package esprit_market.service.forumService;

import esprit_market.dto.forum.CreatePostDto;
import esprit_market.dto.forum.UpdatePostDto;
import esprit_market.entity.forum.Post;
import esprit_market.mappers.ForumMapper;
import esprit_market.repository.forumRepository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService implements IPostService {
    private final PostRepository repository;

    @Override
    public List<Post> findAll() {
        return repository.findAll();
    }

    @Override
    public Post findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    @Override
    public Post create(CreatePostDto dto) {
        Post entity = ForumMapper.toPost(dto);
        if (entity == null) return null;
        return repository.save(entity);
    }

    @Override
    public Post update(ObjectId id, UpdatePostDto dto) {
        Post existing = repository.findById(id).orElse(null);
        if (existing == null || dto == null) return existing;
        if (dto.getContent() != null) existing.setContent(dto.getContent());
        if (dto.getPinned() != null) existing.setPinned(dto.getPinned());
        if (dto.getApproved() != null) existing.setApproved(dto.getApproved());
        return repository.save(existing);
    }

    @Override
    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
