package esprit_market.modules.market.service.impl;

import esprit_market.config.Exceptions;
import esprit_market.modules.market.dto.negotiation.CreateNegotiationRequest;
import esprit_market.modules.market.dto.negotiation.NegotiationResponse;
import esprit_market.modules.market.dto.negotiation.UpdateNegotiationRequest;
import esprit_market.modules.market.entity.Negotiation;
import esprit_market.modules.market.entity.Proposal;
import esprit_market.modules.market.enums.NegotiationAction;
import esprit_market.modules.market.enums.NegotiationStatus;
import esprit_market.modules.market.enums.NotificationType;
import esprit_market.modules.market.mapper.MarketMapper;
import esprit_market.modules.market.repository.MarketNegotiationJpaRepository;
import esprit_market.modules.market.repository.MarketProductJpaRepository;
import esprit_market.modules.market.repository.MarketProposalJpaRepository;
import esprit_market.modules.market.repository.MarketUserJpaRepository;
import esprit_market.modules.market.service.NegotiationService;
import esprit_market.modules.market.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class NegotiationServiceImpl implements NegotiationService {
    private final MarketNegotiationJpaRepository negotiationRepository;
    private final MarketProposalJpaRepository proposalRepository;
    private final MarketProductJpaRepository marketProductRepository;
    private final MarketUserJpaRepository marketUserRepository;
    private final NotificationService notificationService;
    private final MarketMapper mapper;

    @Override
    public NegotiationResponse createNegotiation(CreateNegotiationRequest request, UUID clientId) {
        var product = marketProductRepository.findById(request.productId())
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Product not found"));
        var client = marketUserRepository.findById(clientId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Client not found"));

        Negotiation negotiation = Negotiation.builder()
                .status(NegotiationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .product(product)
                .client(client)
                .seller(product.getSeller())
                .build();
        negotiation = negotiationRepository.save(negotiation);

        Proposal firstProposal = Proposal.builder()
                .negotiation(negotiation)
                .proposedPrice(request.proposedPrice())
                .accepted(false)
                .createdAt(LocalDateTime.now())
                .build();
        proposalRepository.save(firstProposal);
        negotiation.getProposals().add(firstProposal);

        notificationService.createNotification(
                product.getSeller().getId(),
                "New negotiation started",
                "A client proposed a new price for " + product.getName(),
                NotificationType.NEGOTIATION_UPDATE
        );
        return mapper.toNegotiationResponse(negotiation);
    }

    @Override
    @Transactional(readOnly = true)
    public NegotiationResponse getNegotiationById(UUID id, UUID actorId) {
        Negotiation negotiation = getNegotiation(id);
        if (!actorId.equals(negotiation.getClient().getId()) && !actorId.equals(negotiation.getSeller().getId())) {
            throw new Exceptions.AccessDeniedException("Only participants can view this negotiation");
        }
        return mapper.toNegotiationResponse(negotiation);
    }

    @Override
    public NegotiationResponse updateNegotiation(UUID id, UpdateNegotiationRequest request, UUID actorId) {
        Negotiation negotiation = getNegotiation(id);
        if (!actorId.equals(negotiation.getSeller().getId())) {
            throw new Exceptions.AccessDeniedException("Only seller can update negotiation");
        }
        if (negotiation.getStatus() == NegotiationStatus.CLOSED) {
            throw new Exceptions.BadRequestException("Closed negotiation cannot be updated");
        }

        if (request.action() == NegotiationAction.COUNTER) {
            if (request.newPrice() == null || request.newPrice() <= 0) {
                throw new Exceptions.BadRequestException("newPrice must be positive for COUNTER action");
            }
            Proposal proposal = Proposal.builder()
                    .negotiation(negotiation)
                    .proposedPrice(request.newPrice())
                    .accepted(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            proposalRepository.save(proposal);
            negotiation.getProposals().add(proposal);
            negotiation.setStatus(NegotiationStatus.PENDING);
        } else if (request.action() == NegotiationAction.ACCEPT) {
            negotiation.setStatus(NegotiationStatus.ACCEPTED);
            if (!negotiation.getProposals().isEmpty()) {
                negotiation.getProposals().get(negotiation.getProposals().size() - 1).setAccepted(true);
            }
        } else if (request.action() == NegotiationAction.REJECT) {
            negotiation.setStatus(NegotiationStatus.REJECTED);
        }

        negotiationRepository.save(negotiation);
        notificationService.createNotification(
                negotiation.getClient().getId(),
                "Negotiation updated",
                "Negotiation for " + negotiation.getProduct().getName() + " is now " + negotiation.getStatus(),
                NotificationType.NEGOTIATION_UPDATE
        );
        return mapper.toNegotiationResponse(negotiation);
    }

    @Override
    public void closeNegotiation(UUID id, UUID actorId) {
        Negotiation negotiation = getNegotiation(id);
        if (!actorId.equals(negotiation.getClient().getId()) && !actorId.equals(negotiation.getSeller().getId())) {
            throw new Exceptions.AccessDeniedException("Only participants can close negotiation");
        }
        negotiation.setStatus(NegotiationStatus.CLOSED);
        negotiationRepository.save(negotiation);
    }

    private Negotiation getNegotiation(UUID id) {
        return negotiationRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Negotiation not found"));
    }
}
