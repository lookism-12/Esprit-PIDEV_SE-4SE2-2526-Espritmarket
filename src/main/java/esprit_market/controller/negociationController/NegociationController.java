package esprit_market.controller.negociationController;

import esprit_market.dto.negociation.NegociationDTO;
import esprit_market.dto.negociation.ProposalDTO;
import esprit_market.Enum.negociationEnum.NegociationStatuts;
import esprit_market.entity.user.User;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.negociationService.NegociationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/negociations")
@RequiredArgsConstructor
@Tag(name = "Négociation", description = "Gestion des négociations de prix entre clients et services")
public class NegociationController {

    private final NegociationService negociationService;
    private final UserRepository userRepository;

    // Résolution de l'ObjectId depuis le JWT (email → User → id)
    private ObjectId resolveUserId(Authentication authentication) {
        if (authentication == null)
            throw new RuntimeException("Authentification requise (JWT manquant)");
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + email));
        return user.getId();
    }

    // ─────────────────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Créer une négociation", description = "L'ID client est extrait du JWT")
    public ResponseEntity<NegociationDTO> create(
            @Valid @RequestBody NegociationDTO dto,
            Authentication authentication) {
        ObjectId clientId = resolveUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(negociationService.createNegociation(dto, clientId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une négociation par ID")
    public ResponseEntity<NegociationDTO> getById(@PathVariable String id) {
        return ResponseEntity.ok(negociationService.getNegociationById(new ObjectId(id)));
    }

    @GetMapping
    @Operation(summary = "Toutes les négociations — ADMIN")
    public ResponseEntity<List<NegociationDTO>> getAll() {
        return ResponseEntity.ok(negociationService.getAllNegociations());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer ma négociation", description = "L'ID client est extrait du JWT")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            Authentication authentication) {
        ObjectId clientId = resolveUserId(authentication);
        negociationService.deleteNegociation(new ObjectId(id), clientId);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────
    // Mes négociations
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/my")
    @Operation(summary = "Mes négociations (basé sur le JWT)")
    public ResponseEntity<List<NegociationDTO>> getMy(Authentication authentication) {
        ObjectId clientId = resolveUserId(authentication);
        return ResponseEntity.ok(negociationService.getMyNegociations(clientId));
    }

    // ─────────────────────────────────────────────────────────────
    // Filtres
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/service/{serviceId}")
    @Operation(summary = "Négociations par service")
    public ResponseEntity<List<NegociationDTO>> getByService(@PathVariable String serviceId) {
        return ResponseEntity.ok(negociationService.getNegociationsByServiceId(new ObjectId(serviceId)));
    }

    @GetMapping("/statuts/{statuts}")
    @Operation(summary = "Négociations par statut")
    public ResponseEntity<List<NegociationDTO>> getByStatuts(@PathVariable NegociationStatuts statuts) {
        return ResponseEntity.ok(negociationService.getNegociationsByStatuts(statuts));
    }

    // ─────────────────────────────────────────────────────────────
    // Actions métier
    // ─────────────────────────────────────────────────────────────

    @PatchMapping("/{id}/statuts")
    @Operation(summary = "Changer le statut d'une négociation (ACCEPTED, REJECTED...)")
    public ResponseEntity<NegociationDTO> updateStatuts(
            @PathVariable String id,
            @RequestParam NegociationStatuts statuts,
            Authentication authentication) {
        ObjectId userId = resolveUserId(authentication);
        return ResponseEntity.ok(negociationService.updateStatuts(new ObjectId(id), statuts, userId));
    }

    @PostMapping("/{id}/proposals")
    @Operation(summary = "Ajouter une proposition ou contre-proposition")
    public ResponseEntity<NegociationDTO> addProposal(
            @PathVariable String id,
            @Valid @RequestBody ProposalDTO proposalDTO,
            Authentication authentication) {
        ObjectId senderId = resolveUserId(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(negociationService.addProposal(new ObjectId(id), proposalDTO, senderId));
    }
}