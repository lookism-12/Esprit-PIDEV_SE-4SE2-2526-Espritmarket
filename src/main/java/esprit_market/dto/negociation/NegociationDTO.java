package esprit_market.dto.negociation;

import esprit_market.Enum.negociationEnum.NegociationStatuts;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NegociationDTO {

    private String id;

    // clientId NON exposé dans le DTO — il est résolu via JWT côté serveur

    @NotBlank(message = "L'id du service est obligatoire")
    private String serviceId; // ObjectId du ServiceEntity sous forme String

    private NegociationStatuts statuts;

    private List<ProposalDTO> proposals;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Données enrichies en lecture (non persistées)
    private String serviceName;
    private String clientFullName;
}