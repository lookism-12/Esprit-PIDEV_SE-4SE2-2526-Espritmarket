package esprit_market.dto.negociation;

import esprit_market.Enum.negociationEnum.NegociationStatuts;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NegociationResponse {

    private String id;
    private String clientId;
    private String clientFullName;
    private String serviceId;
    private String serviceName;
    private Double serviceOriginalPrice;
    private String productId;
    private String productName;
    private Double productOriginalPrice;
    private String itemDescription;
    private NegociationStatuts status;
    private List<ProposalResponse> proposals;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // AI Prediction Fields
    private Double aiAcceptanceProbability;
    private List<String> aiExplanation;
}
