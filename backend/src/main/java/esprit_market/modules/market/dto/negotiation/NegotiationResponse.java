package esprit_market.modules.market.dto.negotiation;

import esprit_market.modules.market.enums.NegotiationStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record NegotiationResponse(
        UUID id,
        String productName,
        NegotiationStatus status,
        String clientName,
        String sellerName,
        List<ProposalResponse> proposals,
        LocalDateTime createdAt
) {
}
