package esprit_market.service.SAVService;

import esprit_market.entity.SAV.SavFeedback;
import esprit_market.repository.SAVRespository.SavFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SavFeedbackService implements ISavFeedbackService {
    private final SavFeedbackRepository repository;

    public List<SavFeedback> findAll() {
        return repository.findAll();
    }

    public SavFeedback save(SavFeedback feedback) {
        return repository.save(feedback);
    }

    public SavFeedback findById(ObjectId id) {
        return repository.findById(id).orElse(null);
    }

    public void deleteById(ObjectId id) {
        repository.deleteById(id);
    }
}
