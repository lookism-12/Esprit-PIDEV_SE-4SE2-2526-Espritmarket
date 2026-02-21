package esprit_market.service;

import esprit_market.entity.Comment;
import esprit_market.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository repository;

    public List<Comment> findAll() { return repository.findAll(); }
    public Comment save(Comment comment) { return repository.save(comment); }
    public Comment findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
