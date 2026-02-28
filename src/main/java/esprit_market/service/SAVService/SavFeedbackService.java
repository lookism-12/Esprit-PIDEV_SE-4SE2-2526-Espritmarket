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
        // Enforce cart item reference (You can only review what you ordered)
        if (!cartItemRepository.existsById(new ObjectId(request.getCartItemId()))) {
            throw new RuntimeException(
                    "Article du panier (CartItem) introuvable pour l'ID: " + request.getCartItemId());
        }

        SavFeedback feedback = savMapper.toSavFeedbackEntity(request);
        SavFeedback saved = savFeedbackRepository.save(feedback);
        return savMapper.toSavFeedbackResponse(saved);
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
            throw new RuntimeException(
                    "Article du panier (CartItem) introuvable pour l'ID: " + request.getCartItemId());
        }

        feedback.setType(request.getType());
        feedback.setMessage(request.getMessage());
        feedback.setRating(request.getRating());
        feedback.setReason(request.getReason());
        if (request.getStatus() != null) {
            feedback.setStatus(request.getStatus());
        }
        feedback.setCartItemId(new ObjectId(request.getCartItemId()));

        SavFeedback updated = savFeedbackRepository.save(feedback);
        return savMapper.toSavFeedbackResponse(updated);
    }

    @Override
    public SavFeedbackResponseDTO updateFeedbackStatus(String id, String status) {
        SavFeedback feedback = savFeedbackRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Feedback introuvable avec l'ID: " + id));

        feedback.setStatus(status);
        SavFeedback updated = savFeedbackRepository.save(feedback);
        return savMapper.toSavFeedbackResponse(updated);
    }

    @Override
    public void deleteFeedback(String id) {
        if (!savFeedbackRepository.existsById(new ObjectId(id))) {
            throw new RuntimeException("Feedback introuvable avec l'ID: " + id);
        }
        savFeedbackRepository.deleteById(new ObjectId(id));
    }
}
