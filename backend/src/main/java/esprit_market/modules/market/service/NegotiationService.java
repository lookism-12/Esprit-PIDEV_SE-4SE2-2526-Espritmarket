package esprit_market.modules.market.service;

import esprit_market.modules.market.dto.negotiation.CreateNegotiationRequest;
import esprit_market.modules.market.dto.negotiation.NegotiationResponse;
import esprit_market.modules.market.dto.negotiation.UpdateNegotiationRequest;

import java.util.UUID;

public interface NegotiationService {
    NegotiationResponse createNegotiation(CreateNegotiationRequest request, UUID clientId);
    NegotiationResponse getNegotiationById(UUID id, UUID actorId);
    NegotiationResponse updateNegotiation(UUID id, UpdateNegotiationRequest request, UUID actorId);
    void closeNegotiation(UUID id, UUID actorId);
}
