package esprit_market.modules.market.mapper;

import esprit_market.modules.market.dto.negotiation.NegotiationResponse;
import esprit_market.modules.market.dto.negotiation.ProposalResponse;
import esprit_market.modules.market.dto.notification.NotificationResponse;
import esprit_market.modules.market.entity.Negotiation;
import esprit_market.modules.market.entity.Notification;
import esprit_market.modules.market.entity.Proposal;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MarketMapper {

    public ProposalResponse toProposalResponse(Proposal proposal) {
        return new ProposalResponse(
                proposal.getProposedPrice(),
                proposal.isAccepted(),
                proposal.getCreatedAt()
        );
    }

    public NegotiationResponse toNegotiationResponse(Negotiation negotiation) {
        List<ProposalResponse> proposals = negotiation.getProposals()
                .stream()
                .map(this::toProposalResponse)
                .toList();

        return new NegotiationResponse(
                negotiation.getId(),
                negotiation.getProduct().getName(),
                negotiation.getStatus(),
                negotiation.getClient().getFullName(),
                negotiation.getSeller().getFullName(),
                proposals,
                negotiation.getCreatedAt()
        );
    }

    public NotificationResponse toNotificationResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.isActive(),
                notification.getCreatedAt()
        );
    }
}
