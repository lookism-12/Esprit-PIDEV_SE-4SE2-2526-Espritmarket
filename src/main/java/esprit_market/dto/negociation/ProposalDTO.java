package esprit_market.dto.negociation;

import esprit_market.Enum.negociationEnum.ProposalStatuts;
import esprit_market.Enum.negociationEnum.ProposalType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalDTO {

    // senderId NON exposé dans le DTO — résolu via JWT côté serveur

    @NotNull(message = "Le montant est obligatoire")
    @Positive(message = "Le montant doit être positif")
    private Double amount;

    private String message;

    @NotNull(message = "Le type est obligatoire")
    private ProposalType type; // PROPOSAL ou COUNTER_PROPOSAL

    private ProposalStatuts statuts;

    private LocalDateTime createdAt;

    // Donnée enrichie en lecture
    private String senderFullName;
}