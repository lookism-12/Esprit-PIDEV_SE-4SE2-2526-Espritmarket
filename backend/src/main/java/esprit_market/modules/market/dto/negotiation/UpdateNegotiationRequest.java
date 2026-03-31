package esprit_market.modules.market.dto.negotiation;

import esprit_market.modules.market.enums.NegotiationAction;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record UpdateNegotiationRequest(
        @NotNull NegotiationAction action,
        @Positive Double newPrice
) {
}
