package esprit_market.service.SAVService;

import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.entity.SAV.SavFeedback;
import esprit_market.mappers.SAVMapper;
import esprit_market.repository.SAVRepository.SavFeedbackRepository;
import esprit_market.repository.cartRepository.CartItemRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavFeedbackService implements ISavFeedbackService {

    private final SavFeedbackRepository savFeedbackRepository;
    private final CartItemRepository cartItemRepository;
    private final SAVMapper savMapper;

    @Override
    public SavFeedbackResponseDTO createFeedback(SavFeedbackRequestDTO request) {
        if (!cartItemRepository.existsById(new ObjectId(request.getCartItemId()))) {
            throw new RuntimeException("Article du panier (CartItem) introuvable pour l'ID: " + request.getCartItemId());
        }
        SavFeedback feedback = savMapper.toSavFeedbackEntity(request);
        feedback.setReadByAdmin(false);
        return savMapper.toSavFeedbackResponse(savFeedbackRepository.save(feedback));
    }

    @Override
    public SavFeedbackResponseDTO getFeedbackById(String id) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback introuvable avec l'ID: " + id));
        return savMapper.toSavFeedbackResponse(feedback);
    }

    @Override
    public List<SavFeedbackResponseDTO> getAllFeedbacks() {
        return savFeedbackRepository.findAll().stream()
                .map(savMapper::toSavFeedbackResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SavFeedbackResponseDTO> getFeedbacksByCartItem(String cartItemId) {
        return savFeedbackRepository.findByCartItemId(new ObjectId(cartItemId)).stream()
                .map(savMapper::toSavFeedbackResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<SavFeedbackResponseDTO> getFeedbacksByType(String type) {
        return savFeedbackRepository.findByType(type).stream()
                .map(savMapper::toSavFeedbackResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SavFeedbackResponseDTO updateFeedback(String id, SavFeedbackRequestDTO request) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback introuvable avec l'ID: " + id));
        if (!cartItemRepository.existsById(new ObjectId(request.getCartItemId()))) {
            throw new RuntimeException("Article du panier (CartItem) introuvable pour l'ID: " + request.getCartItemId());
        }
        feedback.setType(request.getType());
        feedback.setMessage(request.getMessage());
        feedback.setRating(request.getRating());
        feedback.setReason(request.getReason());
        if (request.getStatus() != null) feedback.setStatus(request.getStatus());
        feedback.setProblemNature(request.getProblemNature());
        feedback.setPriority(request.getPriority());
        feedback.setDesiredSolution(request.getDesiredSolution());
        feedback.setPositiveTags(request.getPositiveTags());
        feedback.setRecommendsProduct(request.getRecommendsProduct());
        feedback.setAdminResponse(request.getAdminResponse());
        if (request.getReadByAdmin() != null) feedback.setReadByAdmin(request.getReadByAdmin());
        feedback.setCartItemId(new ObjectId(request.getCartItemId()));
        return savMapper.toSavFeedbackResponse(savFeedbackRepository.save(feedback));
    }

    @Override
    public SavFeedbackResponseDTO updateFeedbackStatus(String id, String status) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback introuvable avec l'ID: " + id));
        feedback.setStatus(status);
        if (!"PENDING".equalsIgnoreCase(status)) feedback.setReadByAdmin(true);
        return savMapper.toSavFeedbackResponse(savFeedbackRepository.save(feedback));
    }

    @Override
    public SavFeedbackResponseDTO updateFeedbackAdminResponse(String id, String adminResponse) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback introuvable avec l'ID: " + id));
        feedback.setAdminResponse(adminResponse);
        feedback.setReadByAdmin(true);
        return savMapper.toSavFeedbackResponse(savFeedbackRepository.save(feedback));
    }

    @Override
    public void deleteFeedback(String id) {
        if (!savFeedbackRepository.existsById(new ObjectId(id))) {
            throw new RuntimeException("Feedback introuvable avec l'ID: " + id);
        }
        savFeedbackRepository.deleteById(new ObjectId(id));
    }
}
