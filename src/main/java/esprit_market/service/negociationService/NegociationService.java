package esprit_market.service.negociationService;

import esprit_market.dto.negociation.NegociationDTO;
import esprit_market.dto.negociation.ProposalDTO;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.negociation.Negociation;
import esprit_market.Enum.negociationEnum.NegociationStatuts;
import esprit_market.entity.negociation.Proposal;
import esprit_market.Enum.negociationEnum.ProposalStatuts;
import esprit_market.Enum.notificationEnum.NotificationType;
import esprit_market.entity.user.User;
import esprit_market.mappers.negociationMapper.NegociationMapper;
import esprit_market.repository.negociationRepository.NegociationRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.notificationService.INotificationService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NegociationService implements INegociationService {

    private final NegociationRepository negociationRepository;
    private final NegociationMapper negociationMapper;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ShopRepository shopRepository;
    private final INotificationService notificationService;

    private User getUser(ObjectId id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable : " + id));
    }

    private ServiceEntity getService(String id) {
        return serviceRepository.findById(new ObjectId(id))
                .orElseThrow(() -> new RuntimeException("Service introuvable : " + id));
    }

    private User getShopOwner(ServiceEntity service) {
        if (service == null || service.getShopId() == null)
            return null;
        Shop shop = shopRepository.findById(service.getShopId()).orElse(null);
        if (shop == null || shop.getOwnerId() == null)
            return null;
        return userRepository.findById(shop.getOwnerId()).orElse(null);
    }

    @Override
    public NegociationDTO createNegociation(NegociationDTO dto, ObjectId clientId) {
        User client = getUser(clientId);
        ServiceEntity service = getService(dto.getServiceId());

        if (negociationRepository.existsByClientAndServiceAndStatuts(client, service, NegociationStatuts.PENDING) ||
                negociationRepository.existsByClientAndServiceAndStatuts(client, service,
                        NegociationStatuts.IN_PROGRESS)) {
            throw new RuntimeException("Une négociation est déjà en cours pour ce service.");
        }

        Negociation negociation = Negociation.builder()
                .client(client)
                .service(service)
                .statuts(NegociationStatuts.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Negociation saved = negociationRepository.save(negociation);

        // Notify Provider
        User provider = getShopOwner(service);
        if (provider != null) {
            notificationService.sendNotification(provider,
                    "Nouvelle négociation",
                    "Le client " + client.getFirstName() + " souhaite négocier pour " + service.getName(),
                    NotificationType.INTERNAL_NOTIFICATION,
                    saved.getId().toHexString());
        }

        return negociationMapper.toDTO(saved);
    }

    @Override
    public NegociationDTO getNegociationById(ObjectId id) {
        return negociationMapper.toDTO(
                negociationRepository.findById(id)
                        .orElseThrow(() -> new RuntimeException("Négociation introuvable : " + id)));
    }

    @Override
    public List<NegociationDTO> getAllNegociations() {
        return negociationRepository.findAll().stream()
                .map(negociationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NegociationDTO> getMyNegociations(ObjectId clientId) {
        User client = getUser(clientId);
        return negociationRepository.findByClient(client).stream()
                .map(negociationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NegociationDTO> getNegociationsByServiceId(ObjectId serviceId) {
        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service introuvable : " + serviceId));
        return negociationRepository.findByService(service).stream()
                .map(negociationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NegociationDTO> getNegociationsByStatuts(NegociationStatuts statuts) {
        return negociationRepository.findByStatuts(statuts).stream()
                .map(negociationMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public NegociationDTO updateStatuts(ObjectId id, NegociationStatuts statuts, ObjectId userId) {
        Negociation negociation = negociationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Négociation introuvable : " + id));

        User provider = getShopOwner(negociation.getService());
        boolean isClient = negociation.getClient().getId().equals(userId);
        boolean isProvider = provider != null && provider.getId().equals(userId);

        if (!isClient && !isProvider) {
            throw new RuntimeException("Accès refusé : vous n'êtes ni le client ni le prestataire.");
        }

        negociation.setStatuts(statuts);
        negociation.setUpdatedAt(LocalDateTime.now());
        Negociation saved = negociationRepository.save(negociation);

        // Notify other party
        User recipient = isClient ? provider : negociation.getClient();
        if (recipient != null) {
            notificationService.sendNotification(recipient,
                    "Statut de négociation mis à jour",
                    "La négociation pour " + negociation.getService().getName() + " est désormais : " + statuts,
                    NotificationType.INTERNAL_NOTIFICATION,
                    saved.getId().toHexString());
        }

        return negociationMapper.toDTO(saved);
    }

    @Override
    public NegociationDTO addProposal(ObjectId negociationId, ProposalDTO proposalDTO, ObjectId senderId) {
        Negociation negociation = negociationRepository.findById(negociationId)
                .orElseThrow(() -> new RuntimeException("Négociation introuvable : " + negociationId));

        if (negociation.getStatuts() == NegociationStatuts.ACCEPTED ||
                negociation.getStatuts() == NegociationStatuts.REJECTED ||
                negociation.getStatuts() == NegociationStatuts.CANCELLED) {
            throw new RuntimeException("Impossible d'ajouter une proposition : négociation terminée.");
        }

        User sender = getUser(senderId);
        User provider = getShopOwner(negociation.getService());
        boolean isClient = negociation.getClient().getId().equals(senderId);
        boolean isProvider = provider != null && provider.getId().equals(senderId);

        if (!isClient && !isProvider) {
            throw new RuntimeException("Accès refusé : vous ne faites pas partie de cette négociation.");
        }

        Proposal proposal = negociationMapper.toProposalEntity(proposalDTO);
        proposal.setSender(sender);
        proposal.setStatuts(ProposalStatuts.PENDING);
        proposal.setCreatedAt(LocalDateTime.now());

        negociation.getProposals().add(proposal);
        negociation.setStatuts(NegociationStatuts.IN_PROGRESS);
        negociation.setUpdatedAt(LocalDateTime.now());

        Negociation saved = negociationRepository.save(negociation);

        // Notify other party
        User recipient = isClient ? provider : negociation.getClient();
        if (recipient != null) {
            notificationService.sendNotification(recipient,
                    "Nouvelle proposition",
                    "Vous avez reçu une offre de " + proposal.getAmount() + " TND pour "
                            + negociation.getService().getName(),
                    NotificationType.INTERNAL_NOTIFICATION,
                    saved.getId().toHexString());
        }

        return negociationMapper.toDTO(saved);
    }

    @Override
    public void deleteNegociation(ObjectId id, ObjectId clientId) {
        Negociation negociation = negociationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Négociation introuvable : " + id));
        if (!negociation.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Accès refusé : vous n'êtes pas l'initiateur de cette négociation.");
        }
        negociationRepository.deleteById(id);
    }
}