package esprit_market.service;

import esprit_market.entity.SavFeedback;
import esprit_market.repository.SavFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavFeedbackService {
    private final SavFeedbackRepository repository;

    public List<SavFeedback> findAll() { return repository.findAll(); }
    public SavFeedback save(SavFeedback feedback) { return repository.save(feedback); }
    public SavFeedback findById(ObjectId id) { return repository.findById(id).orElse(null); }
    public void deleteById(ObjectId id) { repository.deleteById(id); }
}
