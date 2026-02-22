package esprit_market.service.SAVService;

import esprit_market.entity.SAV.SavFeedback;
import org.bson.types.ObjectId;

import java.util.List;

public interface ISavFeedbackService {
    List<SavFeedback> findAll();

    SavFeedback save(SavFeedback feedback);

    SavFeedback findById(ObjectId id);

    void deleteById(ObjectId id);
}
