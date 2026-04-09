package esprit_market.mappers.negociationMapper;

import esprit_market.dto.negociation.NegociationResponse;
import esprit_market.dto.negociation.ProposalRequest;
import esprit_market.dto.negociation.ProposalResponse;
import esprit_market.entity.negociation.Negociation;
import esprit_market.entity.negociation.Proposal;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class NegociationMapper {

    public NegociationResponse toResponse(Negociation negociation) {
        if (negociation == null) {
            return null;
        }

        return NegociationResponse.builder()
                .id(negociation.getId() != null ? negociation.getId().toHexString() : null)
                .clientId(negociation.getClient() != null ? negociation.getClient().getId().toHexString() : null)
                .clientFullName(negociation.getClient() != null
                        ? negociation.getClient().getFirstName() + " " + negociation.getClient().getLastName()
                        : null)
                .serviceId(negociation.getService() != null ? negociation.getService().getId().toHexString() : null)
                .serviceName(negociation.getService() != null ? negociation.getService().getName() : null)
                .serviceOriginalPrice(negociation.getService() != null ? negociation.getService().getPrice() : null)
                .productId(negociation.getProduct() != null ? negociation.getProduct().getId().toHexString() : null)
                .productName(negociation.getProduct() != null ? negociation.getProduct().getName() : null)
                .productOriginalPrice(negociation.getProduct() != null ? negociation.getProduct().getPrice() : null)
                .status(negociation.getStatuts())
                .proposals(toProposalResponseList(negociation.getProposals()))
                .createdAt(negociation.getCreatedAt())
                .updatedAt(negociation.getUpdatedAt())
                .build();
    }

    public ProposalResponse toProposalResponse(Proposal proposal) {
        if (proposal == null) {
            return null;
        }

        return ProposalResponse.builder()
                .senderId(proposal.getSender() != null ? proposal.getSender().getId().toHexString() : null)
                .senderFullName(proposal.getSender() != null
                        ? proposal.getSender().getFirstName() + " " + proposal.getSender().getLastName()
                        : null)
                .amount(proposal.getAmount())
                .message(proposal.getMessage())
                .type(proposal.getType())
                .status(proposal.getStatuts())
                .createdAt(proposal.getCreatedAt())
                .build();
    }

    public Proposal toProposalEntity(ProposalRequest request) {
        if (request == null) {
            return null;
        }

        return Proposal.builder()
                .amount(request.getAmount())
                .message(request.getMessage())
                .type(request.getType())
                .build();
    }

    private List<ProposalResponse> toProposalResponseList(List<Proposal> proposals) {
        if (proposals == null) {
            return Collections.emptyList();
        }
        return proposals.stream()
                .map(this::toProposalResponse)
                .collect(Collectors.toList());
    }
}