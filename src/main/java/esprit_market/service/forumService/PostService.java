package esprit_market.service.forumService;

import esprit_market.entity.forum.Post;
import esprit_market.repository.forumRepository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService implements IPostService {
    private final PostRepository repository;

    public List<Post> findAll() {
        return repository.findAll();
    }
}
