package esprit_market.service;

import esprit_market.entity.RideReview;
import esprit_market.repository.RideReviewRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RideReviewService {
    private final RideReviewRepository repository;

    public List<RideReview> findAll() { return repository.findAll(); }
    public RideReview save(RideReview review) { return repository.save(review); }
    public RideReview findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
