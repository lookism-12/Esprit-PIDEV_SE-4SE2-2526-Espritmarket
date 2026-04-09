package esprit_market.controller.negociationController;

import esprit_market.Enum.negociationEnum.NegociationStatuts;
import esprit_market.dto.negociation.NegociationRequest;
import esprit_market.dto.negociation.NegociationResponse;
import esprit_market.dto.negociation.ProposalRequest;
import esprit_market.service.negociationService.INegociationService;
import esprit_market.service.userService.IUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/negociations")
@RequiredArgsConstructor
@Tag(name = "Negociations", description = "Price negotiation management between clients and services")
public class NegociationController {

    private static final Logger log = LoggerFactory.getLogger(NegociationController.class);

    private final INegociationService negociationService;
    private final IUserService userService;

    private String resolveUserId(Authentication authentication) {
        return userService.resolveUserId(authentication.getName()).toHexString();
    }

    @PostMapping
    @Operation(summary = "Create a negociation", description = "Client ID is extracted from JWT")
    public ResponseEntity<NegociationResponse> create(
            @Valid @RequestBody NegociationRequest request,
            Authentication authentication) {
        log.info("Creating negociation for service: {}", request.getServiceId());
        String clientId = resolveUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(negociationService.createNegociation(request, clientId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get negociation by ID")
    public ResponseEntity<NegociationResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(negociationService.getNegociationById(id));
    }

    @GetMapping
    @Operation(summary = "Get all negociations with pagination (ADMIN)")
    public ResponseEntity<Page<NegociationResponse>> getAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(negociationService.getAllNegociations(pageable));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all negociations as a flat list (no pagination)")
    public ResponseEntity<List<NegociationResponse>> getAllList() {
        return ResponseEntity.ok(negociationService.getAllNegociationsList());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete my negociation", description = "Client ID is extracted from JWT")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication authentication) {
        negociationService.deleteNegociation(id, resolveUserId(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    @Operation(summary = "Get my negociations (based on JWT)")
    public ResponseEntity<List<NegociationResponse>> getMy(Authentication authentication) {
        return ResponseEntity.ok(negociationService.getMyNegociations(resolveUserId(authentication)));
    }

    @GetMapping("/incoming")
    @Operation(summary = "Get incoming negociations (received offers) (based on JWT)")
    public ResponseEntity<List<NegociationResponse>> getIncoming(Authentication authentication) {
        return ResponseEntity.ok(negociationService.getIncomingNegociations(resolveUserId(authentication)));
    }

    @GetMapping("/service/{serviceId}")
    @Operation(summary = "Get negociations by service")
    public ResponseEntity<List<NegociationResponse>> getByService(@PathVariable String serviceId) {
        return ResponseEntity.ok(negociationService.getNegociationsByServiceId(serviceId));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get negociations by status")
    public ResponseEntity<List<NegociationResponse>> getByStatus(@PathVariable NegociationStatuts status) {
        return ResponseEntity.ok(negociationService.getNegociationsByStatus(status));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update negociation status (ACCEPTED, REJECTED...)")
    public ResponseEntity<NegociationResponse> updateStatus(
            @PathVariable String id,
            @RequestParam NegociationStatuts status,
            Authentication authentication) {
        return ResponseEntity.ok(negociationService.updateStatus(id, status, resolveUserId(authentication)));
    }

    @PatchMapping("/{id}/status/direct")
    @Operation(summary = "Update negociation status directly (no ownership check)")
    public ResponseEntity<NegociationResponse> updateStatusDirect(
            @PathVariable String id,
            @RequestParam NegociationStatuts status) {
        return ResponseEntity.ok(negociationService.updateStatusDirect(id, status));
    }

    @PostMapping("/{id}/proposals")
    @Operation(summary = "Add a proposal or counter-proposal")
    public ResponseEntity<NegociationResponse> addProposal(
            @PathVariable String id,
            @Valid @RequestBody ProposalRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(negociationService.addProposal(id, request, resolveUserId(authentication)));
    }

    @PostMapping("/{id}/proposals/direct")
    @Operation(summary = "Add a counter-proposal directly (no ownership check)")
    public ResponseEntity<NegociationResponse> addProposalDirect(
            @PathVariable String id,
            @Valid @RequestBody ProposalRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(negociationService.addProposalDirect(id, request, resolveUserId(authentication)));
    }
}
