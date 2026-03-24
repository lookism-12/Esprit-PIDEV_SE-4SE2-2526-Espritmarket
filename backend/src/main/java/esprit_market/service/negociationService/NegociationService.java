package esprit_market.service.negociationService;

import esprit_market.Enum.negociationEnum.NegociationStatuts;
import esprit_market.Enum.negociationEnum.ProposalStatuts;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.config.Exceptions.AccessDeniedException;
import esprit_market.config.Exceptions.BadRequestException;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.negociation.NegociationRequest;
import esprit_market.dto.negociation.NegociationResponse;
import esprit_market.dto.negociation.ProposalRequest;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.negociation.Negociation;
import esprit_market.entity.negociation.Proposal;
import esprit_market.entity.user.User;
import esprit_market.mappers.negociationMapper.NegociationMapper;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.negociationRepository.NegociationRepository;
import esprit_market.repository.userRepository.UserRepository;
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
    private final ShopRepository shopRepository;
    private final INotificationService notificationService;

    private User getUser(String id) {
        return userRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    private ServiceEntity getService(String id) {
        return serviceRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Service", "id", id));
    }

    private User getShopOwner(ServiceEntity service) {
        if (service == null || service.getShopId() == null) {
            return null;
        }
        Shop shop = shopRepository.findById(service.getShopId()).orElse(null);
        if (shop == null || shop.getOwnerId() == null) {
            return null;
        }
        return userRepository.findById(shop.getOwnerId()).orElse(null);
    }

    @Override
    @Transactional
    public NegociationResponse createNegociation(NegociationRequest request, String clientId) {
        log.info("Creating negociation for service: {} by client: {}", request.getServiceId(), clientId);

        User client = getUser(clientId);
        ServiceEntity service = getService(request.getServiceId());

        if (negociationRepository.existsByClientAndServiceAndStatuts(client, service, NegociationStatuts.PENDING) ||
                negociationRepository.existsByClientAndServiceAndStatuts(client, service, NegociationStatuts.IN_PROGRESS)) {
            throw new BadRequestException("A negociation is already in progress for this service");
        }

        Negociation negociation = Negociation.builder()
                .client(client)
                .service(service)
                .statuts(NegociationStatuts.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Negociation saved = negociationRepository.save(negociation);
        log.info("Negociation created with id: {}", saved.getId());

        User provider = getShopOwner(service);
        if (provider != null) {
            notificationService.sendNotification(provider,
                    "New Negociation",
                    "Client " + client.getFirstName() + " wants to negotiate for " + service.getName(),
                    NotificationType.INTERNAL_NOTIFICATION,
                    saved.getId().toHexString());
        }

        return negociationMapper.toResponse(saved);
    }

    @Override
    public NegociationResponse getNegociationById(String id) {
        log.debug("Fetching negociation by id: {}", id);
        Negociation negociation = negociationRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", id));
        return negociationMapper.toResponse(negociation);
    }

    @Override
    public Page<NegociationResponse> getAllNegociations(Pageable pageable) {
        log.debug("Fetching all negociations with pagination");
        return negociationRepository.findAll(pageable)
                .map(negociationMapper::toResponse);
    }

    @Override
    public List<NegociationResponse> getMyNegociations(String clientId) {
        log.debug("Fetching negociations for client: {}", clientId);
        User client = getUser(clientId);
        return negociationRepository.findByClient(client).stream()
                .map(negociationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<NegociationResponse> getNegociationsByServiceId(String serviceId) {
        log.debug("Fetching negociations for service: {}", serviceId);
        ServiceEntity service = getService(serviceId);
        return negociationRepository.findByService(service).stream()
                .map(negociationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<NegociationResponse> getNegociationsByStatus(NegociationStatuts status) {
        log.debug("Fetching negociations by status: {}", status);
        return negociationRepository.findByStatuts(status).stream()
                .map(negociationMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NegociationResponse updateStatus(String id, NegociationStatuts status, String userId) {
        log.info("Updating negociation status: {} to {}", id, status);

        Negociation negociation = negociationRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", id));

        User provider = getShopOwner(negociation.getService());
        boolean isClient = negociation.getClient().getId().toHexString().equals(userId);
        boolean isProvider = provider != null && provider.getId().toHexString().equals(userId);

        if (!isClient && !isProvider) {
            throw new AccessDeniedException("You are not authorized to update this negociation");
        }

        negociation.setStatuts(status);
        negociation.setUpdatedAt(LocalDateTime.now());
        Negociation saved = negociationRepository.save(negociation);

        User recipient = isClient ? provider : negociation.getClient();
        if (recipient != null) {
            notificationService.sendNotification(recipient,
                    "Negociation Status Updated",
                    "Negociation for " + negociation.getService().getName() + " is now: " + status,
                    NotificationType.INTERNAL_NOTIFICATION,
                    saved.getId().toHexString());
        }

        log.info("Negociation {} status updated to {}", id, status);
        return negociationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public NegociationResponse addProposal(String negociationId, ProposalRequest request, String senderId) {
        log.info("Adding proposal to negociation: {}", negociationId);

        Negociation negociation = negociationRepository.findById(new ObjectId(negociationId))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", negociationId));

        if (negociation.getStatuts() == NegociationStatuts.ACCEPTED ||
                negociation.getStatuts() == NegociationStatuts.REJECTED ||
                negociation.getStatuts() == NegociationStatuts.CANCELLED) {
            throw new BadRequestException("Cannot add proposal: negociation is already closed");
        }

        User sender = getUser(senderId);
        User provider = getShopOwner(negociation.getService());
        boolean isClient = negociation.getClient().getId().toHexString().equals(senderId);
        boolean isProvider = provider != null && provider.getId().toHexString().equals(senderId);

        if (!isClient && !isProvider) {
            throw new AccessDeniedException("You are not part of this negociation");
        }

        Proposal proposal = negociationMapper.toProposalEntity(request);
        proposal.setSender(sender);
        proposal.setStatuts(ProposalStatuts.PENDING);
        proposal.setCreatedAt(LocalDateTime.now());

        negociation.getProposals().add(proposal);
        negociation.setStatuts(NegociationStatuts.IN_PROGRESS);
        negociation.setUpdatedAt(LocalDateTime.now());

        Negociation saved = negociationRepository.save(negociation);

        User recipient = isClient ? provider : negociation.getClient();
        if (recipient != null) {
            notificationService.sendNotification(recipient,
                    "New Proposal",
                    "You received an offer of " + proposal.getAmount() + " TND for " + negociation.getService().getName(),
                    NotificationType.INTERNAL_NOTIFICATION,
                    saved.getId().toHexString());
        }

        log.info("Proposal added to negociation: {}", negociationId);
        return negociationMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteNegociation(String id, String clientId) {
        log.info("Deleting negociation: {} by client: {}", id, clientId);

        Negociation negociation = negociationRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new ResourceNotFoundException("Negociation", "id", id));

        if (!negociation.getClient().getId().toHexString().equals(clientId)) {
            throw new AccessDeniedException("You are not the owner of this negociation");
        }

        negociationRepository.deleteById(new ObjectId(id));
        log.info("Negociation deleted: {}", id);
    }
}