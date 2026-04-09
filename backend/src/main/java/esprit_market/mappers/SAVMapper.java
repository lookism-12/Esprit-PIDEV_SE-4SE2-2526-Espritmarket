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
        if (entity == null) return null;
        return DeliveryResponseDTO.builder()
                .id(entity.getId() != null ? entity.getId().toHexString() : null)
                .address(entity.getAddress())
                .deliveryDate(entity.getDeliveryDate())
                .status(entity.getStatus())
                .userId(entity.getUserId() != null ? entity.getUserId().toHexString() : null)
                .cartId(entity.getCartId() != null ? entity.getCartId().toHexString() : null)
                .build();
    }

    public SavFeedback toSavFeedbackEntity(SavFeedbackRequestDTO dto) {
        if (dto == null) return null;
        return SavFeedback.builder()
                .type(dto.getType())
                .message(dto.getMessage())
                .rating(dto.getRating())
                .reason(dto.getReason())
                .status(dto.getStatus() != null ? dto.getStatus() : "PENDING")
                .problemNature(dto.getProblemNature())
                .priority(dto.getPriority())
                .desiredSolution(dto.getDesiredSolution())
                .positiveTags(dto.getPositiveTags())
                .recommendsProduct(dto.getRecommendsProduct())
                .adminResponse(dto.getAdminResponse())
                .readByAdmin(dto.getReadByAdmin() != null ? dto.getReadByAdmin() : false)
                .cartItemId(new ObjectId(dto.getCartItemId()))
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
                .cartItemId(entity.getCartItemId() != null ? entity.getCartItemId().toHexString() : null)
                .build();
    }
}
