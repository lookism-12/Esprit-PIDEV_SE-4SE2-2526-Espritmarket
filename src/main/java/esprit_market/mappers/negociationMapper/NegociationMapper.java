package esprit_market.mappers.negociationMapper;

import esprit_market.dto.negociation.NegociationDTO;
import esprit_market.dto.negociation.ProposalDTO;
import esprit_market.entity.negociation.Negociation;
import esprit_market.entity.negociation.Proposal;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class NegociationMapper {

    public NegociationDTO toDTO(Negociation n) {
        if (n == null) return null;
        return NegociationDTO.builder()
                .id(n.getId() != null ? n.getId().toHexString() : null)
                // @DBRef résolu automatiquement → on expose juste ce qu'on veut
                .serviceId(n.getService() != null ? n.getService().getId().toHexString() : null)
                .serviceName(n.getService() != null ? n.getService().getName() : null)
                .clientFullName(n.getClient() != null
                        ? n.getClient().getFirstName() + " " + n.getClient().getLastName() : null)
                .statuts(n.getStatuts())
                .proposals(toProposalDTOList(n.getProposals()))
                .createdAt(n.getCreatedAt())
                .updatedAt(n.getUpdatedAt())
                .build();
    }

    public ProposalDTO toProposalDTO(Proposal p) {
        if (p == null) return null;
        return ProposalDTO.builder()
                .senderFullName(p.getSender() != null
                        ? p.getSender().getFirstName() + " " + p.getSender().getLastName() : null)
                .amount(p.getAmount())
                .message(p.getMessage())
                .type(p.getType())
                .statuts(p.getStatuts())
                .createdAt(p.getCreatedAt())
                .build();
    }

    public Proposal toProposalEntity(ProposalDTO dto) {
        if (dto == null) return null;
        return Proposal.builder()
                .amount(dto.getAmount())
                .message(dto.getMessage())
                .type(dto.getType())
                .statuts(dto.getStatuts())
                .createdAt(dto.getCreatedAt())
                .build();
    }

    private List<ProposalDTO> toProposalDTOList(List<Proposal> proposals) {
        if (proposals == null) return Collections.emptyList();
        return proposals.stream().map(this::toProposalDTO).collect(Collectors.toList());
    }
}