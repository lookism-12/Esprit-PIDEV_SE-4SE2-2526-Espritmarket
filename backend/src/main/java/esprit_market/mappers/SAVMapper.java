package esprit_market.mappers;

import esprit_market.dto.SAV.DeliveryRequestDTO;
import esprit_market.dto.SAV.DeliveryResponseDTO;
import esprit_market.dto.SAV.SavFeedbackRequestDTO;
import esprit_market.dto.SAV.SavFeedbackResponseDTO;
import esprit_market.entity.SAV.Delivery;
import esprit_market.entity.SAV.SavFeedback;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

@Component
public class SAVMapper {

    public Delivery toDeliveryEntity(DeliveryRequestDTO dto) {
        if (dto == null) return null;
        return Delivery.builder()
                .address(dto.getAddress())
                .deliveryDate(dto.getDeliveryDate())
                .status(dto.getStatus() != null ? dto.getStatus() : "PENDING")
                .userId(new ObjectId(dto.getUserId()))
                .cartId(new ObjectId(dto.getCartId()))
                .build();
    }

    public DeliveryResponseDTO toDeliveryResponse(Delivery entity) {
        if (entity == null) {
            System.err.println("⚠️ SAVMapper: Attempted to map null Delivery entity");
            return null;
        }
        
        try {
            return DeliveryResponseDTO.builder()
                    .id(entity.getId() != null ? entity.getId().toHexString() : null)
                    .address(entity.getAddress() != null ? entity.getAddress() : "")
                    .deliveryDate(entity.getDeliveryDate())
                    .status(entity.getStatus() != null ? entity.getStatus() : "PREPARING")
                    .userId(entity.getUserId() != null ? entity.getUserId().toHexString() : null)
                    .cartId(entity.getCartId() != null ? entity.getCartId().toHexString() : null)
                    .orderId(entity.getOrderId() != null ? entity.getOrderId().toHexString() : null)
                    .deliveredAt(entity.getDeliveredAt())
                    .returnedAt(entity.getReturnedAt())
                    .returnReason(entity.getReturnReason())
                    .pendingDriverId(entity.getPendingDriverId() != null ? entity.getPendingDriverId().toHexString() : null)
                    .declineReason(entity.getDeclineReason())
                    .declinedByDriverId(entity.getDeclinedByDriverId())
                    .build();
        } catch (Exception e) {
            System.err.println("❌ SAVMapper: Error mapping delivery entity: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to map Delivery to DTO: " + e.getMessage(), e);
        }
    }

    public SavFeedback toSavFeedbackEntity(SavFeedbackRequestDTO dto) {
        if (dto == null) return null;
        return SavFeedback.builder()
                .type(dto.getType())
                .message(dto.getMessage())
                .rating(dto.getRating() != null ? dto.getRating() : 0)
                .reason(dto.getReason())
                .status(dto.getStatus() != null ? dto.getStatus() : "PENDING")
                .problemNature(dto.getProblemNature())
                .priority(dto.getPriority())
                .desiredSolution(dto.getDesiredSolution())
                .positiveTags(dto.getPositiveTags())
                .recommendsProduct(dto.getRecommendsProduct())
                .adminResponse(dto.getAdminResponse())
                .readByAdmin(dto.getReadByAdmin() != null ? dto.getReadByAdmin() : false)
                .imageUrls(dto.getImageUrls())
                .cartItemId(hasText(dto.getCartItemId()) ? new ObjectId(dto.getCartItemId()) : null)
                .targetType(dto.getTargetType() != null && !dto.getTargetType().isBlank() ? dto.getTargetType() : "PRODUCT")
                .deliveryAgentId(hasText(dto.getDeliveryAgentId()) ? new ObjectId(dto.getDeliveryAgentId()) : null)
                .userId(hasText(dto.getUserId()) ? new ObjectId(dto.getUserId()) : null)
                .build();
    }

    public SavFeedbackResponseDTO toSavFeedbackResponse(SavFeedback entity) {
        if (entity == null) return null;
        return SavFeedbackResponseDTO.builder()
                .id(entity.getId() != null ? entity.getId().toHexString() : null)
                .type(entity.getType())
                .message(entity.getMessage())
                .rating(entity.getRating())
                .reason(entity.getReason())
                .status(entity.getStatus())
                .problemNature(entity.getProblemNature())
                .priority(entity.getPriority())
                .desiredSolution(entity.getDesiredSolution())
                .positiveTags(entity.getPositiveTags())
                .recommendsProduct(entity.getRecommendsProduct())
                .adminResponse(entity.getAdminResponse())
                .readByAdmin(entity.getReadByAdmin())
                .creationDate(entity.getCreationDate())
                .lastUpdatedDate(entity.getLastUpdatedDate())
                .resolvedDate(entity.getResolvedDate())
                .imageUrls(entity.getImageUrls())
                .aiSimilarityScore(entity.getAiSimilarityScore())
                .aiDecision(entity.getAiDecision())
                .aiRecommendation(entity.getAiRecommendation())
                .cartItemId(entity.getCartItemId() != null ? entity.getCartItemId().toHexString() : null)
                .userId(entity.getUserId() != null ? entity.getUserId().toHexString() : null)
                .targetType(entity.getTargetType() != null ? entity.getTargetType() : "PRODUCT")
                .deliveryAgentId(entity.getDeliveryAgentId() != null ? entity.getDeliveryAgentId().toHexString() : null)
                .build();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
