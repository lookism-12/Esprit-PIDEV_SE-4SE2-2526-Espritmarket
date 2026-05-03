package esprit_market.dto.negociation;

import esprit_market.Enum.negociationEnum.ProposalStatuts;
import esprit_market.Enum.negociationEnum.ProposalType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalResponse {

    private String senderId;
    private String senderFullName;
    private Double amount;
    private Integer quantity;
    private String message;
    private String exchangeImage;
    private Boolean isExchange;
    
    // 🎯 AI Negotiation: Discount percentage visible to both client and provider
    // Shows the discount % that the client offered (e.g., 30% off)
    private Double discountPercentage;
    
    private ProposalType type;
    private ProposalStatuts status;
    private LocalDateTime createdAt;
}
