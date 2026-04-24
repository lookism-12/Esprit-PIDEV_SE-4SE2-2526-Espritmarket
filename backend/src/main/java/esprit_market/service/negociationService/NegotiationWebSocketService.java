package esprit_market.service.negociationService;

import esprit_market.dto.negociation.NegociationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Broadcasts negotiation updates over WebSocket.
 * Called from NegociationService after every state-changing operation.
 */
@Service
@RequiredArgsConstructor
public class NegotiationWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcast(NegociationResponse response) {
        messagingTemplate.convertAndSend(
                "/topic/negotiation/" + response.getId(),
                response
        );
    }
}
