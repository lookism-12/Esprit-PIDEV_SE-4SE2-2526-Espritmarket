package esprit_market.entity.negociation;

import esprit_market.Enum.negociationEnum.ProposalStatuts;
import esprit_market.Enum.negociationEnum.ProposalType;
import esprit_market.entity.user.User;
import lombok.*;
import org.springframework.data.mongodb.core.mapping.DBRef;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Proposal {

    @DBRef
    private User sender; // l'utilisateur qui envoie la proposition (client ou vendeur)

    private Double amount;
    private Integer quantity;
    private String message;
    private String exchangeImage;
    private Boolean isExchange;

    private ProposalType type;       // PROPOSAL ou COUNTER_PROPOSAL
    private ProposalStatuts statuts; // PENDING, ACCEPTED, REJECTED...

    private LocalDateTime createdAt;
}