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
import esprit_market.service.notificationService.INotificationService;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NegociationService Unit Tests")
class NegociationServiceTest {

    @Mock private NegociationRepository negociationRepository;
    @Mock private NegociationMapper negociationMapper;
    @Mock private UserRepository userRepository;
    @Mock private ServiceRepository serviceRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ShopRepository shopRepository;
    @Mock private INotificationService notificationService;

    @InjectMocks
    private NegociationService negociationService;

    // ── Shared test fixtures ──────────────────────────────────────────────────
    private ObjectId clientId;
    private ObjectId providerId;
    private ObjectId negId;
    private ObjectId shopId;
    private ObjectId serviceObjId;
    private ObjectId productObjId;

    private User client;
    private User provider;
    private ServiceEntity service;
    private Product product;
    private Shop shop;
    private Negociation negociation;
    private NegociationResponse response;

    @BeforeEach
    void setUp() {
        clientId    = new ObjectId();
        providerId  = new ObjectId();
        negId       = new ObjectId();
        shopId      = new ObjectId();
        serviceObjId = new ObjectId();
        productObjId = new ObjectId();

        client = User.builder()
                .id(clientId).firstName("Alice").lastName("Smith")
                .email("alice@test.com").notificationsEnabled(true)
                .internalNotificationsEnabled(true).externalNotificationsEnabled(true)
                .build();

        provider = User.builder()
                .id(providerId).firstName("Bob").lastName("Jones")
                .email("bob@test.com").notificationsEnabled(true)
                .internalNotificationsEnabled(true).externalNotificationsEnabled(true)
                .build();

        service = new ServiceEntity();
        service.setId(serviceObjId);
        service.setName("Logo Design");
        service.setShopId(shopId);

        product = new Product();
        product.setId(productObjId);
        product.setName("Wireless Keyboard");
        product.setShopId(shopId);

        shop = new Shop();
        shop.setId(shopId);
        shop.setOwnerId(providerId);

        negociation = Negociation.builder()
                .id(negId)
                .client(client)
                .service(service)
                .statuts(NegociationStatuts.PENDING)
                .proposals(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        response = NegociationResponse.builder()
                .id(negId.toHexString())
                .clientId(clientId.toHexString())
                .clientFullName("Alice Smith")
                .serviceName("Logo Design")
                .status(NegociationStatuts.PENDING)
                .proposals(List.of())
                .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("createNegociation()")
    class CreateNegociation {

        @Test
        @DisplayName("creates negotiation for a service and notifies provider")
        void createForService_notifiesProvider() {
            NegociationRequest req = new NegociationRequest();
            req.setServiceId(serviceObjId.toHexString());
            req.setAmount(80.0);

            when(userRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(serviceRepository.findById(serviceObjId)).thenReturn(Optional.of(service));
            when(negociationRepository.existsByClientAndServiceAndStatuts(client, service, NegociationStatuts.PENDING)).thenReturn(false);
            when(negociationRepository.existsByClientAndServiceAndStatuts(client, service, NegociationStatuts.IN_PROGRESS)).thenReturn(false);
            when(negociationRepository.save(any(Negociation.class))).thenReturn(negociation);
            when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));
            when(negociationMapper.toResponse(negociation)).thenReturn(response);

            NegociationResponse result = negociationService.createNegociation(req, clientId.toHexString());

            assertThat(result).isNotNull();
            assertThat(result.getClientFullName()).isEqualTo("Alice Smith");

            // Provider must receive a notification
            verify(notificationService).sendNotification(
                    eq(provider),
                    eq("New Negociation"),
                    contains("Alice"),
                    eq(NotificationType.INTERNAL_NOTIFICATION),
                    anyString()
            );
        }

        @Test
        @DisplayName("creates negotiation for a product when service not found")
        void createForProduct_whenServiceNotFound() {
            NegociationRequest req = new NegociationRequest();
            req.setServiceId(productObjId.toHexString());
            req.setAmount(50.0);

            when(userRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(serviceRepository.findById(productObjId)).thenReturn(Optional.empty());
            when(productRepository.findById(productObjId)).thenReturn(Optional.of(product));
            when(negociationRepository.existsByClientAndProductAndStatuts(client, product, NegociationStatuts.PENDING)).thenReturn(false);
            when(negociationRepository.existsByClientAndProductAndStatuts(client, product, NegociationStatuts.IN_PROGRESS)).thenReturn(false);

            Negociation productNeg = Negociation.builder()
                    .id(negId).client(client).product(product)
                    .statuts(NegociationStatuts.IN_PROGRESS)
                    .proposals(new ArrayList<>())
                    .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                    .build();

            when(negociationRepository.save(any())).thenReturn(productNeg);
            when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));
            when(negociationMapper.toResponse(productNeg)).thenReturn(response);

            NegociationResponse result = negociationService.createNegociation(req, clientId.toHexString());

            assertThat(result).isNotNull();
            verify(negociationRepository).save(any(Negociation.class));
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when item not found")
        void throwsWhenItemNotFound() {
            NegociationRequest req = new NegociationRequest();
            req.setServiceId(new ObjectId().toHexString());

            when(userRepository.findById(any(ObjectId.class))).thenReturn(Optional.of(client));
            when(serviceRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());
            when(productRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> negociationService.createNegociation(req, clientId.toHexString()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("throws BadRequestException when negotiation already in progress for service")
        void throwsWhenDuplicateServiceNegotiation() {
            NegociationRequest req = new NegociationRequest();
            req.setServiceId(serviceObjId.toHexString());

            when(userRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(serviceRepository.findById(serviceObjId)).thenReturn(Optional.of(service));
            when(negociationRepository.existsByClientAndServiceAndStatuts(client, service, NegociationStatuts.PENDING)).thenReturn(true);

            assertThatThrownBy(() -> negociationService.createNegociation(req, clientId.toHexString()))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already in progress");
        }

        @Test
        @DisplayName("sets status to PENDING when no amount provided")
        void statusIsPendingWithoutAmount() {
            NegociationRequest req = new NegociationRequest();
            req.setServiceId(serviceObjId.toHexString());
            req.setAmount(null);

            when(userRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(serviceRepository.findById(serviceObjId)).thenReturn(Optional.of(service));
            when(negociationRepository.existsByClientAndServiceAndStatuts(any(), any(), any())).thenReturn(false);
            when(negociationRepository.save(any())).thenReturn(negociation);
            when(shopRepository.findById(any())).thenReturn(Optional.empty());
            when(negociationMapper.toResponse(any())).thenReturn(response);

            negociationService.createNegociation(req, clientId.toHexString());

            ArgumentCaptor<Negociation> captor = ArgumentCaptor.forClass(Negociation.class);
            verify(negociationRepository).save(captor.capture());
            assertThat(captor.getValue().getStatuts()).isEqualTo(NegociationStatuts.PENDING);
        }

        @Test
        @DisplayName("sets status to IN_PROGRESS when amount is provided")
        void statusIsInProgressWithAmount() {
            NegociationRequest req = new NegociationRequest();
            req.setServiceId(serviceObjId.toHexString());
            req.setAmount(100.0);

            when(userRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(serviceRepository.findById(serviceObjId)).thenReturn(Optional.of(service));
            when(negociationRepository.existsByClientAndServiceAndStatuts(any(), any(), any())).thenReturn(false);
            when(negociationRepository.save(any())).thenReturn(negociation);
            when(shopRepository.findById(any())).thenReturn(Optional.empty());
            when(negociationMapper.toResponse(any())).thenReturn(response);

            negociationService.createNegociation(req, clientId.toHexString());

            ArgumentCaptor<Negociation> captor = ArgumentCaptor.forClass(Negociation.class);
            verify(negociationRepository).save(captor.capture());
            assertThat(captor.getValue().getStatuts()).isEqualTo(NegociationStatuts.IN_PROGRESS);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // READ
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("Read operations")
    class ReadOperations {

        @Test
        @DisplayName("getNegociationById returns response when found")
        void getById_found() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(negociationMapper.toResponse(negociation)).thenReturn(response);

            NegociationResponse result = negociationService.getNegociationById(negId.toHexString());

            assertThat(result.getId()).isEqualTo(negId.toHexString());
        }

        @Test
        @DisplayName("getNegociationById throws when not found")
        void getById_notFound() {
            when(negociationRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> negociationService.getNegociationById(negId.toHexString()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("getMyNegociations returns list for client")
        void getMyNegociations_returnsList() {
            when(userRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(negociationRepository.findByClient(client)).thenReturn(List.of(negociation));
            when(negociationMapper.toResponse(negociation)).thenReturn(response);

            List<NegociationResponse> results = negociationService.getMyNegociations(clientId.toHexString());

            assertThat(results).hasSize(1);
        }

        @Test
        @DisplayName("getMyNegociations returns empty list when no negotiations")
        void getMyNegociations_empty() {
            when(userRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(negociationRepository.findByClient(client)).thenReturn(List.of());

            List<NegociationResponse> results = negociationService.getMyNegociations(clientId.toHexString());

            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("getAllNegociationsList returns all negotiations")
        void getAllList_returnsAll() {
            when(negociationRepository.findAll()).thenReturn(List.of(negociation));
            when(negociationMapper.toResponse(negociation)).thenReturn(response);

            List<NegociationResponse> results = negociationService.getAllNegociationsList();

            assertThat(results).hasSize(1);
        }

        @Test
        @DisplayName("getIncomingNegociations returns empty when provider has no shops")
        void getIncoming_noShops_returnsEmpty() {
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));
            when(shopRepository.findByOwnerId(providerId)).thenReturn(List.of());

            List<NegociationResponse> results = negociationService.getIncomingNegociations(providerId.toHexString());

            assertThat(results).isEmpty();
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS TRANSITIONS
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("Status transitions")
    class StatusTransitions {

        @Test
        @DisplayName("PENDING → ACCEPTED via updateStatus by client")
        void pendingToAccepted_byClient() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));
            when(negociationRepository.save(any())).thenReturn(negociation);
            when(negociationMapper.toResponse(any())).thenReturn(
                    NegociationResponse.builder().id(negId.toHexString()).clientId(clientId.toHexString())
                            .clientFullName("Alice Smith").status(NegociationStatuts.ACCEPTED).proposals(List.of()).build());

            NegociationResponse result = negociationService.updateStatus(
                    negId.toHexString(), NegociationStatuts.ACCEPTED, clientId.toHexString());

            assertThat(result.getStatus()).isEqualTo(NegociationStatuts.ACCEPTED);
            verify(negociationRepository).save(argThat(n -> n.getStatuts() == NegociationStatuts.ACCEPTED));
        }

        @Test
        @DisplayName("PENDING → REJECTED via updateStatus by client")
        void pendingToRejected_byClient() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));
            when(negociationRepository.save(any())).thenReturn(negociation);
            when(negociationMapper.toResponse(any())).thenReturn(
                    NegociationResponse.builder().id(negId.toHexString()).clientId(clientId.toHexString())
                            .clientFullName("Alice Smith").status(NegociationStatuts.REJECTED).proposals(List.of()).build());

            NegociationResponse result = negociationService.updateStatus(
                    negId.toHexString(), NegociationStatuts.REJECTED, clientId.toHexString());

            assertThat(result.getStatus()).isEqualTo(NegociationStatuts.REJECTED);
        }

        @Test
        @DisplayName("updateStatus throws AccessDeniedException for unauthorized user")
        void updateStatus_unauthorizedUser_throws() {
            ObjectId strangerIdObj = new ObjectId();
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));

            assertThatThrownBy(() -> negociationService.updateStatus(
                    negId.toHexString(), NegociationStatuts.ACCEPTED, strangerIdObj.toHexString()))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("updateStatusDirect accepts without ownership check and notifies client")
        void updateStatusDirect_acceptsAndNotifiesClient() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(negociationRepository.save(any())).thenReturn(negociation);
            when(negociationMapper.toResponse(any())).thenReturn(
                    NegociationResponse.builder().id(negId.toHexString()).clientId(clientId.toHexString())
                            .clientFullName("Alice Smith").status(NegociationStatuts.ACCEPTED).proposals(List.of()).build());

            NegociationResponse result = negociationService.updateStatusDirect(
                    negId.toHexString(), NegociationStatuts.ACCEPTED);

            assertThat(result.getStatus()).isEqualTo(NegociationStatuts.ACCEPTED);
            verify(notificationService).sendNotification(
                    eq(client),
                    contains("Negotiation"),
                    contains("accepted"),
                    eq(NotificationType.INTERNAL_NOTIFICATION),
                    anyString()
            );
        }

        @Test
        @DisplayName("updateStatusDirect rejection notifies client with rejection message")
        void updateStatusDirect_rejectNotifiesClient() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(negociationRepository.save(any())).thenReturn(negociation);
            when(negociationMapper.toResponse(any())).thenReturn(
                    NegociationResponse.builder().id(negId.toHexString()).clientId(clientId.toHexString())
                            .clientFullName("Alice Smith").status(NegociationStatuts.REJECTED).proposals(List.of()).build());

            negociationService.updateStatusDirect(negId.toHexString(), NegociationStatuts.REJECTED);

            verify(notificationService).sendNotification(
                    eq(client), anyString(), contains("rejected"),
                    eq(NotificationType.INTERNAL_NOTIFICATION), anyString());
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COUNTER OFFER / PROPOSALS
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("Counter offer / addProposal")
    class CounterOffer {

        private ProposalRequest proposalRequest;
        private Proposal proposal;

        @BeforeEach
        void setUpProposal() {
            proposalRequest = new ProposalRequest();
            proposalRequest.setAmount(75.0);
            proposalRequest.setMessage("Counter offer");
            proposalRequest.setType(ProposalType.COUNTER_PROPOSAL);

            proposal = Proposal.builder()
                    .sender(provider).amount(75.0)
                    .type(ProposalType.COUNTER_PROPOSAL)
                    .statuts(ProposalStatuts.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        @Test
        @DisplayName("addProposalDirect adds counter offer and notifies client")
        void addProposalDirect_notifiesClient() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));
            when(negociationMapper.toProposalEntity(proposalRequest)).thenReturn(proposal);
            when(negociationRepository.save(any())).thenReturn(negociation);
            when(negociationMapper.toResponse(any())).thenReturn(
                    NegociationResponse.builder().id(negId.toHexString()).clientId(clientId.toHexString())
                            .clientFullName("Alice Smith").status(NegociationStatuts.IN_PROGRESS).proposals(List.of()).build());

            NegociationResponse result = negociationService.addProposalDirect(
                    negId.toHexString(), proposalRequest, providerId.toHexString());

            assertThat(result.getStatus()).isEqualTo(NegociationStatuts.IN_PROGRESS);
            verify(notificationService).sendNotification(
                    eq(client),
                    eq("Counter Offer Received"),
                    contains("75.0"),
                    eq(NotificationType.INTERNAL_NOTIFICATION),
                    anyString()
            );
        }

        @Test
        @DisplayName("addProposalDirect throws BadRequestException when negotiation is ACCEPTED")
        void addProposalDirect_throwsWhenClosed_accepted() {
            negociation.setStatuts(NegociationStatuts.ACCEPTED);
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));

            assertThatThrownBy(() -> negociationService.addProposalDirect(
                    negId.toHexString(), proposalRequest, providerId.toHexString()))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("already closed");
        }

        @Test
        @DisplayName("addProposalDirect throws BadRequestException when negotiation is REJECTED")
        void addProposalDirect_throwsWhenClosed_rejected() {
            negociation.setStatuts(NegociationStatuts.REJECTED);
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));

            assertThatThrownBy(() -> negociationService.addProposalDirect(
                    negId.toHexString(), proposalRequest, providerId.toHexString()))
                    .isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("addProposalDirect throws BadRequestException when negotiation is CANCELLED")
        void addProposalDirect_throwsWhenCancelled() {
            negociation.setStatuts(NegociationStatuts.CANCELLED);
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));

            assertThatThrownBy(() -> negociationService.addProposalDirect(
                    negId.toHexString(), proposalRequest, providerId.toHexString()))
                    .isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("addProposal sets negotiation status to IN_PROGRESS")
        void addProposal_setsInProgress() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(userRepository.findById(clientId)).thenReturn(Optional.of(client));
            when(negociationMapper.toProposalEntity(proposalRequest)).thenReturn(proposal);
            when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));
            when(negociationRepository.save(any())).thenReturn(negociation);
            when(negociationMapper.toResponse(any())).thenReturn(
                    NegociationResponse.builder().id(negId.toHexString()).clientId(clientId.toHexString())
                            .clientFullName("Alice Smith").status(NegociationStatuts.IN_PROGRESS).proposals(List.of()).build());

            negociationService.addProposal(negId.toHexString(), proposalRequest, clientId.toHexString());

            verify(negociationRepository).save(argThat(n -> n.getStatuts() == NegociationStatuts.IN_PROGRESS));
        }

        @Test
        @DisplayName("addProposal throws AccessDeniedException for non-participant")
        void addProposal_throwsForStranger() {
            ObjectId strangerId = new ObjectId();
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));
            when(userRepository.findById(strangerId)).thenReturn(Optional.of(
                    User.builder().id(strangerId).firstName("X").lastName("Y").build()));
            when(shopRepository.findById(shopId)).thenReturn(Optional.of(shop));
            when(userRepository.findById(providerId)).thenReturn(Optional.of(provider));

            assertThatThrownBy(() -> negociationService.addProposal(
                    negId.toHexString(), proposalRequest, strangerId.toHexString()))
                    .isInstanceOf(AccessDeniedException.class);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DELETE
    // ═══════════════════════════════════════════════════════════════════════════
    @Nested
    @DisplayName("deleteNegociation()")
    class DeleteNegociation {

        @Test
        @DisplayName("deletes negotiation when caller is the client")
        void delete_byOwner_succeeds() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));

            negociationService.deleteNegociation(negId.toHexString(), clientId.toHexString());

            verify(negociationRepository).deleteById(negId);
        }

        @Test
        @DisplayName("throws AccessDeniedException when caller is not the client")
        void delete_byStranger_throws() {
            when(negociationRepository.findById(negId)).thenReturn(Optional.of(negociation));

            assertThatThrownBy(() -> negociationService.deleteNegociation(
                    negId.toHexString(), new ObjectId().toHexString()))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        @DisplayName("throws ResourceNotFoundException when negotiation does not exist")
        void delete_notFound_throws() {
            when(negociationRepository.findById(any(ObjectId.class))).thenReturn(Optional.empty());

            assertThatThrownBy(() -> negociationService.deleteNegociation(
                    negId.toHexString(), clientId.toHexString()))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
