package esprit_market.service.negociationService;

import esprit_market.Enum.negociationEnum.NegociationStatuts;
import esprit_market.Enum.negociationEnum.ProposalStatuts;
import esprit_market.Enum.negociationEnum.ProposalType;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.config.Exceptions.AccessDeniedException;
import esprit_market.config.Exceptions.BadRequestException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.negociation.NegociationRequest;
import esprit_market.dto.negociation.NegociationResponse;
import esprit_market.dto.negociation.ProposalRequest;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.negociation.Negociation;
import esprit_market.entity.negociation.Proposal;
import esprit_market.entity.user.User;
import esprit_market.mappers.negociationMapper.NegociationMapper;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.negociationRepository.NegociationRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.mlService.PredictiveAiService;
import esprit_market.service.notificationService.INotificationService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NegociationService implements INegociationService {

    private static final Logger log = LoggerFactory.getLogger(NegociationService.class);

    private final NegociationRepository negociationRepository;
    private final NegociationMapper negociationMapper;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final INotificationService notificationService;
    private final NegotiationWebSocketService wsService;
    private final PredictiveAiService predictiveAiService;
    private final NegociationPdfService pdfService;

    private User getUser(String id) {
        return userRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    private ServiceEntity getService(String id) {
        return serviceRepository.findById(new ObjectId(id)).orElse(null);
    }

    private Product getProduct(String id) {
        return productRepository.findById(new ObjectId(id)).orElse(null);
    }

    private User getShopOwner(ServiceEntity service, Product product) {
        ObjectId shopId = null;
        if (service != null) shopId = service.getShopId();
        else if (product != null) shopId = product.getShopId();
        if (shopId == null) return null;
        Shop shop = shopRepository.findById(shopId).orElse(null);
        if (shop == null || shop.getOwnerId() == null) return null;
        return userRepository.findById(shop.getOwnerId()).orElse(null);
    }

    private String getItemName(Negociation n) {
        if (n.getService() != null) return n.getService().getName();
        if (n.getProduct() != null) return n.getProduct().getName();
        return "Unknown Item";
    }

    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public NegociationResponse createNegociation(NegociationRequest request, String clientId) {
        log.info("Creating negociation for item: {} by client: {}", request.getServiceId(), clientId);
        User client = getUser(clientId);
        ServiceEntity service = getService(request.getServiceId());
        Product product = null;

        if (service == null) {
            product = getProduct(request.getServiceId());
            if (product == null) throw new ResourceNotFoundException("Item", "id", request.getServiceId());
        }

        if (service != null) {
            if (negociationRepository.existsByClientAndServiceAndStatuts(client, service, NegociationStatuts.PENDING) ||
                    negociationRepository.existsByClientAndServiceAndStatuts(client, service, NegociationStatuts.IN_PROGRESS))
                throw new BadRequestException("A negociation is already in progress for this service");
        } else {
            if (negociationRepository.existsByClientAndProductAndStatuts(client, product, NegociationStatuts.PENDING) ||
                    negociationRepository.existsByClientAndProductAndStatuts(client, product, NegociationStatuts.IN_PROGRESS))
                throw new BadRequestException("A negociation is already in progress for this product");
        }

        Negociation negociation = Negociation.builder()
                .client(client).service(service).product(product)
                .statuts(request.getAmount() != null ? NegociationStatuts.IN_PROGRESS : NegociationStatuts.PENDING)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();

        if (request.getAmount() != null || Boolean.TRUE.equals(request.getIsExchange())) {
            // 🎯 Calculate discount percentage for the proposal
            Double discountPercentage = null;
            if (request.getAmount() != null) {
                Double basePrice = service != null ? service.getPrice() : (product != null ? product.getPrice() : 0.0);
                if (basePrice > 0) {
                    double priceDiff = basePrice - request.getAmount();
                    discountPercentage = (priceDiff / basePrice) * 100.0;
                }
            }
            
            negociation.getProposals().add(Proposal.builder()
                    .amount(request.getAmount())
                    .quantity(request.getQuantity())
                    .message(request.getMessage())
                    .exchangeImage(request.getExchangeImage())
                    .isExchange(request.getIsExchange())
                    .discountPercentage(discountPercentage)
                    .sender(client)
                    .statuts(ProposalStatuts.PENDING)
                    .type(ProposalType.PROPOSAL)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        Negociation saved = negociationRepository.save(negociation);
        User provider = getShopOwner(service, product);
        if (provider != null) {
            notificationService.sendNotification(provider, "New Negociation",
                    "Client " + client.getFirstName() + " wants to negotiate for " + getItemName(saved),
                    NotificationType.INTERNAL_NOTIFICATION, saved.getId().toHexString());
        }
        return negociationMapper.toResponse(saved);
    }

    @Override
    public NegociationResponse getNegociationById(String id) {
        return negociationMapper.toResponse(negociationRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", id)));
    }

    @Override
    public Page<NegociationResponse> getAllNegociations(Pageable pageable) {
        return negociationRepository.findAll(pageable).map(negociationMapper::toResponse);
    }

    @Override
    public List<NegociationResponse> getAllNegociationsList() {
        return negociationRepository.findAll().stream().map(negociationMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NegociationResponse updateStatusDirect(String id, NegociationStatuts status) {
        log.info("Direct status update for negociation: {} to {}", id, status);
        Negociation negociation = negociationRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", id));

        negociation.setStatuts(status);
        negociation.setUpdatedAt(LocalDateTime.now());
        Negociation saved = negociationRepository.save(negociation);

        User client = saved.getClient();
        String itemName = getItemName(saved);
        String statusLabel = status.name().charAt(0) + status.name().substring(1).toLowerCase();

        if (status == NegociationStatuts.ACCEPTED) {
            // Pre-validate PDF generation
            NegociationResponse responseForPdf = negociationMapper.toResponse(saved);
            try {
                pdfService.generateNegociationPdf(responseForPdf);
            } catch (Exception e) {
                log.warn("PDF pre-generation check failed: {}", e.getMessage());
            }
            String pdfLink = "/api/negociations/" + saved.getId().toHexString() + "/pdf";
            String message = "🎉 Your offer for \"" + itemName + "\" has been ACCEPTED!\n" +
                             "Download your contract: " + pdfLink;
            notificationService.sendNotification(client,
                    "✅ Offer Accepted — Contract Ready",
                    message,
                    NotificationType.NEGOTIATION_ACCEPTED,
                    saved.getId().toHexString());
        } else {
            String message = "Your offer for \"" + itemName + "\" has been " + statusLabel + ".";
            notificationService.sendNotification(client,
                    "Negotiation " + statusLabel,
                    message,
                    NotificationType.INTERNAL_NOTIFICATION,
                    saved.getId().toHexString());
        }

        NegociationResponse response = negociationMapper.toResponse(saved);
        wsService.broadcast(response);

        // ── ML incremental learning: send resolved outcome (fire-and-forget) ──
        if (status == NegociationStatuts.ACCEPTED || status == NegociationStatuts.REJECTED) {
            try {
                sendNegotiationFeedbackAsync(saved, status);
            } catch (Exception e) {
                log.warn("ML feedback send failed (non-critical): {}", e.getMessage());
            }
        }

        return response;
    }

    /**
     * Build and send a NegotiationFeedback payload to the ML service.
     * Extracts the last buyer proposal to reconstruct the feature vector.
     */
    private void sendNegotiationFeedbackAsync(Negociation neg, NegociationStatuts status) {
        if (neg.getProposals() == null || neg.getProposals().isEmpty()) return;

        // Find the last proposal made by the client (buyer)
        Proposal lastBuyerProposal = null;
        for (int i = neg.getProposals().size() - 1; i >= 0; i--) {
            Proposal p = neg.getProposals().get(i);
            if (p.getSender() != null && neg.getClient() != null
                    && p.getSender().getId().equals(neg.getClient().getId())) {
                lastBuyerProposal = p;
                break;
            }
        }
        if (lastBuyerProposal == null) return;

        double basePrice    = neg.getProduct() != null ? neg.getProduct().getPrice() : 0.0;
        double offeredPrice = lastBuyerProposal.getAmount() != null ? lastBuyerProposal.getAmount() : 0.0;
        int    qty          = lastBuyerProposal.getQuantity() != null ? lastBuyerProposal.getQuantity() : 1;
        String msg          = lastBuyerProposal.getMessage() != null ? lastBuyerProposal.getMessage() : "";
        boolean hasExchange = Boolean.TRUE.equals(lastBuyerProposal.getIsExchange());
        boolean hasImage    = lastBuyerProposal.getExchangeImage() != null
                              && !lastBuyerProposal.getExchangeImage().isBlank();

        User   buyer      = neg.getClient();
        double buyerRating = buyer != null ? buyer.getAverageRating() : 3.5;

        String category = "General";
        if (neg.getProduct() != null && neg.getProduct().getCategoryIds() != null
                && !neg.getProduct().getCategoryIds().isEmpty()) {
            category = neg.getProduct().getCategoryIds().get(0).toHexString();
        }

        PredictiveAiService.NegotiationFeedback feedback = PredictiveAiService.NegotiationFeedback.builder()
                .base_price(basePrice)
                .offered_price(offeredPrice)
                .quantity(qty)
                .buyer_rating(buyerRating)
                .buyer_account_age_months(12)
                .is_return_customer(0)
                .message_length(msg.length())
                .has_exchange_proposal(hasExchange ? 1 : 0)
                .has_image_attachment(hasImage ? 1 : 0)
                .product_category(category)
                .provider_decision(status == NegociationStatuts.ACCEPTED ? "ACCEPT" : "REJECT")
                .build();

        predictiveAiService.sendNegotiationFeedback(feedback);
        log.debug("ML negotiation feedback sent: decision={}", feedback.getProvider_decision());
    }

    @Override
    @Transactional
    public NegociationResponse addProposalDirect(String negociationId, ProposalRequest request, String senderId) {
        log.info("Direct proposal on negociation: {} by sender: {}", negociationId, senderId);
        Negociation negociation = negociationRepository.findById(new ObjectId(negociationId))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", negociationId));

        if (negociation.getStatuts() == NegociationStatuts.ACCEPTED ||
                negociation.getStatuts() == NegociationStatuts.REJECTED ||
                negociation.getStatuts() == NegociationStatuts.CANCELLED)
            throw new BadRequestException("Cannot add proposal: negociation is already closed");

        User sender = getUser(senderId);
        Proposal proposal = negociationMapper.toProposalEntity(request);
        proposal.setSender(sender);
        proposal.setStatuts(ProposalStatuts.PENDING);
        proposal.setCreatedAt(LocalDateTime.now());
        
        // 🎯 Calculate discount percentage for the proposal
        if (proposal.getAmount() != null) {
            Double basePrice = negociation.getService() != null ? negociation.getService().getPrice() : 
                              (negociation.getProduct() != null ? negociation.getProduct().getPrice() : 0.0);
            if (basePrice > 0) {
                double priceDiff = basePrice - proposal.getAmount();
                proposal.setDiscountPercentage((priceDiff / basePrice) * 100.0);
            }
        }

        negociation.getProposals().add(proposal);
        negociation.setStatuts(NegociationStatuts.IN_PROGRESS);
        negociation.setUpdatedAt(LocalDateTime.now());
        Negociation saved = negociationRepository.save(negociation);

        notificationService.sendNotification(saved.getClient(), "Counter Offer Received",
                "The provider sent a counter offer of " + proposal.getAmount() + " TND for \"" + getItemName(saved) + "\"",
                NotificationType.NEGOTIATION_PROPOSAL, saved.getId().toHexString());

        NegociationResponse response = negociationMapper.toResponse(saved);
        wsService.broadcast(response);
        return response;
    }

    @Override
    public List<NegociationResponse> getMyNegociations(String clientId) {
        User client = getUser(clientId);
        return negociationRepository.findByClient(client).stream()
                .map(negociationMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<NegociationResponse> getIncomingNegociations(String userId) {
        log.info("Fetching incoming negociations for user: {}", userId);
        User provider = getUser(userId);
        List<Shop> shops = shopRepository.findAllByOwnerId(provider.getId());
        if (shops.isEmpty()) return List.of();

        List<ObjectId> shopIds = shops.stream().map(Shop::getId).collect(Collectors.toList());
        List<Product> products = productRepository.findByShopIdIn(shopIds);
        List<ServiceEntity> services = serviceRepository.findByShopIdIn(shopIds);

        return java.util.stream.Stream.concat(
                products.isEmpty() ? java.util.stream.Stream.empty() : negociationRepository.findByProductIn(products).stream(),
                services.isEmpty() ? java.util.stream.Stream.empty() : negociationRepository.findByServiceIn(services).stream()
        ).distinct().map(negociationMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<NegociationResponse> getNegociationsByServiceId(String serviceId) {
        return negociationRepository.findByService(getService(serviceId)).stream()
                .map(negociationMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<NegociationResponse> getNegociationsByStatus(NegociationStatuts status) {
        return negociationRepository.findByStatuts(status).stream()
                .map(negociationMapper::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NegociationResponse updateStatus(String id, NegociationStatuts status, String userId) {
        log.info("Updating negociation status: {} to {}", id, status);
        Negociation negociation = negociationRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", id));

        User provider = getShopOwner(negociation.getService(), negociation.getProduct());
        boolean isClient = negociation.getClient().getId().toHexString().equals(userId);
        boolean isProvider = provider != null && provider.getId().toHexString().equals(userId);

        if (!isClient && !isProvider)
            throw new AccessDeniedException("You are not authorized to update this negociation");

        negociation.setStatuts(status);
        negociation.setUpdatedAt(LocalDateTime.now());
        Negociation saved = negociationRepository.save(negociation);

        User recipient = isClient ? provider : negociation.getClient();
        if (recipient != null) {
            if (status == NegociationStatuts.ACCEPTED && recipient.equals(negociation.getClient())) {
                // Send acceptance notification with PDF link
                String pdfLink = "/api/negociations/" + saved.getId().toHexString() + "/pdf";
                notificationService.sendNotification(recipient,
                        "✅ Offer Accepted — Contract Ready",
                        "🎉 Your offer for \"" + getItemName(negociation) + "\" has been ACCEPTED!\n" +
                        "Download your contract: " + pdfLink,
                        NotificationType.NEGOTIATION_ACCEPTED,
                        saved.getId().toHexString());
            } else {
                notificationService.sendNotification(recipient,
                        "Negociation Status Updated",
                        "Negociation for " + getItemName(negociation) + " is now: " + status,
                        NotificationType.INTERNAL_NOTIFICATION,
                        saved.getId().toHexString());
            }
        }

        log.info("Negociation {} status updated to {}", id, status);
        NegociationResponse response = negociationMapper.toResponse(saved);
        wsService.broadcast(response);
        return response;
    }

    @Override
    @Transactional
    public NegociationResponse addProposal(String negociationId, ProposalRequest request, String senderId) {
        log.info("Adding proposal to negociation: {}", negociationId);
        Negociation negociation = negociationRepository.findById(new ObjectId(negociationId))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", negociationId));

        if (negociation.getStatuts() == NegociationStatuts.ACCEPTED ||
                negociation.getStatuts() == NegociationStatuts.REJECTED ||
                negociation.getStatuts() == NegociationStatuts.CANCELLED)
            throw new BadRequestException("Cannot add proposal: negociation is already closed");

        User sender = getUser(senderId);
        User provider = getShopOwner(negociation.getService(), negociation.getProduct());
        boolean isClient = negociation.getClient().getId().toHexString().equals(senderId);
        boolean isProvider = provider != null && provider.getId().toHexString().equals(senderId);

        if (!isClient && !isProvider)
            throw new AccessDeniedException("You are not part of this negociation");

        Proposal proposal = negociationMapper.toProposalEntity(request);
        proposal.setSender(sender);
        proposal.setStatuts(ProposalStatuts.PENDING);
        proposal.setCreatedAt(LocalDateTime.now());
        
        // 🎯 Calculate discount percentage for the proposal
        if (proposal.getAmount() != null) {
            Double basePrice = negociation.getService() != null ? negociation.getService().getPrice() : 
                              (negociation.getProduct() != null ? negociation.getProduct().getPrice() : 0.0);
            if (basePrice > 0) {
                double priceDiff = basePrice - proposal.getAmount();
                proposal.setDiscountPercentage((priceDiff / basePrice) * 100.0);
            }
        }

        negociation.getProposals().add(proposal);
        negociation.setStatuts(NegociationStatuts.IN_PROGRESS);
        negociation.setUpdatedAt(LocalDateTime.now());
        Negociation saved = negociationRepository.save(negociation);

        User recipient = isClient ? provider : negociation.getClient();
        if (recipient != null) {
            notificationService.sendNotification(recipient, "New Proposal",
                    "You received an offer of " + proposal.getAmount() + " TND for " + getItemName(negociation),
                    NotificationType.NEGOTIATION_PROPOSAL, saved.getId().toHexString());
        }

        log.info("Proposal added to negociation: {}", negociationId);
        NegociationResponse response = negociationMapper.toResponse(saved);
        wsService.broadcast(response);
        return response;
    }

    @Override
    @Transactional
    public void deleteNegociation(String id, String clientId) {
        log.info("Deleting negociation: {} by client: {}", id, clientId);
        Negociation negociation = negociationRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", id));

        if (!negociation.getClient().getId().toHexString().equals(clientId))
            throw new AccessDeniedException("You are not the owner of this negociation");

        negociationRepository.deleteById(new ObjectId(id));
    }

    @Override
    public NegociationResponse predictNegotiation(NegociationRequest request, String clientId) {
        User client = getUser(clientId);
        ServiceEntity service = getService(request.getServiceId());
        Product product = null;
        double basePrice = 0.0;
        String category = "OTHER";

        if (service == null) {
            product = getProduct(request.getServiceId());
            if (product != null) {
                basePrice = product.getPrice();
                category = "PRODUCT"; // Product entity uses categoryIds list, defaulting to PRODUCT for AI
            }
        } else {
            basePrice = service.getPrice();
            category = "SERVICE";
        }

        PredictiveAiService.NegotiationAiRequest aiRequest = PredictiveAiService.NegotiationAiRequest.builder()
                .base_price(basePrice)
                .offered_price(request.getAmount() != null ? request.getAmount() : 0.0)
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .buyer_rating(4.0) // Mock
                .buyer_account_age_months(12) // Mock
                .is_return_customer(0) // Mock
                .message_length(request.getMessage() != null ? request.getMessage().length() : 0)
                .has_exchange_proposal(Boolean.TRUE.equals(request.getIsExchange()) ? 1 : 0)
                .has_image_attachment(request.getExchangeImage() != null ? 1 : 0)
                .product_category(category)
                .build();

        NegociationResponse response = NegociationResponse.builder()
                .clientId(clientId)
                .serviceId(request.getServiceId())
                .serviceOriginalPrice(basePrice)
                .status(NegociationStatuts.PENDING)
                .build();

        try {
            PredictiveAiService.NegotiationAiResponse aiResponse = predictiveAiService.predictNegotiation(aiRequest).block();
            if (aiResponse != null) {
                response.setAiAcceptanceProbability(aiResponse.getAccept_probability());
                response.setAiExplanation(aiResponse.getExplanation());
            }
        } catch (Exception e) {
            log.error("Negotiation AI Prediction failed: {}", e.getMessage());
        }

        return response;
    }
}
