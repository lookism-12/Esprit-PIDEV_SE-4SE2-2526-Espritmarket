package esprit_market.modules.market.dto.negotiation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record CreateNegotiationRequest(
        @NotNull UUID productId,
        @Positive double proposedPrice
) {
}
