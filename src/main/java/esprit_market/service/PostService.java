package esprit_market.service;

import esprit_market.entity.Post;
import esprit_market.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository repository;

    public List<Post> findAll() { return repository.findAll(); }
}
