package esprit_market.modules.market.controller;

import esprit_market.modules.market.dto.negotiation.CreateNegotiationRequest;
import esprit_market.modules.market.dto.negotiation.NegotiationResponse;
import esprit_market.modules.market.dto.negotiation.UpdateNegotiationRequest;
import esprit_market.modules.market.service.CurrentActorService;
import esprit_market.modules.market.service.NegotiationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/negotiations")
@RequiredArgsConstructor
public class NegotiationController {
    private final NegotiationService negotiationService;
    private final CurrentActorService currentActorService;

    @PostMapping
    public ResponseEntity<NegotiationResponse> create(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody CreateNegotiationRequest request
    ) {
        UUID actorId = currentActorService.parseUserId(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(negotiationService.createNegotiation(request, actorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NegotiationResponse> getById(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId
    ) {
        return ResponseEntity.ok(negotiationService.getNegotiationById(id, currentActorService.parseUserId(userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NegotiationResponse> update(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UpdateNegotiationRequest request
    ) {
        return ResponseEntity.ok(negotiationService.updateNegotiation(id, request, currentActorService.parseUserId(userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> close(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId
    ) {
        negotiationService.closeNegotiation(id, currentActorService.parseUserId(userId));
        return ResponseEntity.noContent().build();
    }
}
