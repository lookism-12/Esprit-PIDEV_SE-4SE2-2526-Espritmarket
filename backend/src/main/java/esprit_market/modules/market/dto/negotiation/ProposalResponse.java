package esprit_market.modules.market.dto.negotiation;

import java.time.LocalDateTime;

public record ProposalResponse(
        double proposedPrice,
        boolean accepted,
        LocalDateTime createdAt
) {
}
