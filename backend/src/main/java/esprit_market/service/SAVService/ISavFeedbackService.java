package esprit_market.service.SAVService;

import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import java.util.List;

public interface ISavFeedbackService {
    // FR-SAV1
    SavFeedbackResponseDTO createFeedback(SavFeedbackRequestDTO request);
    // FR-SAV2
    SavFeedbackResponseDTO getFeedbackById(String id);
    List<SavFeedbackResponseDTO> getAllFeedbacks();
    List<SavFeedbackResponseDTO> getFeedbacksByCartItem(String cartItemId);
    List<SavFeedbackResponseDTO> getFeedbacksByType(String type);
    List<SavFeedbackResponseDTO> getFeedbacksByProductId(String productId);
    // FR-SAV3
    SavFeedbackResponseDTO updateFeedback(String id, SavFeedbackRequestDTO request);
    SavFeedbackResponseDTO updateFeedbackStatus(String id, String status);
    SavFeedbackResponseDTO updateFeedbackAdminResponse(String id, String adminResponse);
    // FR-SAV4
    void deleteFeedback(String id);
}
