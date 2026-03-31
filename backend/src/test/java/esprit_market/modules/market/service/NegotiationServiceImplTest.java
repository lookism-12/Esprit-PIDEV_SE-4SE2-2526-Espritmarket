package esprit_market.modules.market.service;

import esprit_market.modules.market.dto.negotiation.CreateNegotiationRequest;
import esprit_market.modules.market.dto.negotiation.UpdateNegotiationRequest;
import esprit_market.modules.market.entity.MarketProduct;
import esprit_market.modules.market.entity.MarketUser;
import esprit_market.modules.market.entity.Negotiation;
import esprit_market.modules.market.enums.NegotiationAction;
import esprit_market.modules.market.enums.NegotiationStatus;
import esprit_market.modules.market.enums.NotificationType;
import esprit_market.modules.market.enums.UserRole;
import esprit_market.modules.market.mapper.MarketMapper;
import esprit_market.modules.market.repository.MarketNegotiationJpaRepository;
import esprit_market.modules.market.repository.MarketProductJpaRepository;
import esprit_market.modules.market.repository.MarketProposalJpaRepository;
import esprit_market.modules.market.repository.MarketUserJpaRepository;
import esprit_market.modules.market.service.impl.NegotiationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NegotiationServiceImplTest {

    @Mock private MarketNegotiationJpaRepository negotiationRepository;
    @Mock private MarketProposalJpaRepository proposalRepository;
    @Mock private MarketProductJpaRepository marketProductRepository;
    @Mock private MarketUserJpaRepository marketUserRepository;
    @Mock private NotificationService notificationService;
    @Spy private MarketMapper mapper;

    @InjectMocks
    private NegotiationServiceImpl negotiationService;

    private MarketUser seller;
    private MarketUser client;
    private MarketProduct product;

    @BeforeEach
    void setUp() {
        seller = MarketUser.builder().id(UUID.randomUUID()).fullName("Seller").role(UserRole.SELLER).build();
        client = MarketUser.builder().id(UUID.randomUUID()).fullName("Client").role(UserRole.USER).build();
        product = MarketProduct.builder().id(UUID.randomUUID()).name("Phone").seller(seller).build();
    }

    @Test
    void createNegotiation_createsPendingWithFirstProposal() {
        when(marketProductRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(marketUserRepository.findById(client.getId())).thenReturn(Optional.of(client));
        when(negotiationRepository.save(any(Negotiation.class))).thenAnswer(inv -> {
            Negotiation n = inv.getArgument(0);
            n.setId(UUID.randomUUID());
            n.setCreatedAt(LocalDateTime.now());
            return n;
        });

        var response = negotiationService.createNegotiation(
                new CreateNegotiationRequest(product.getId(), 900.0),
                client.getId()
        );

        assertEquals(NegotiationStatus.PENDING, response.status());
        verify(proposalRepository, times(1)).save(any());
        verify(notificationService).createNotification(eq(seller.getId()), anyString(), anyString(), eq(NotificationType.NEGOTIATION_UPDATE));
    }

    @Test
    void updateNegotiation_accept_setsAccepted() {
        Negotiation negotiation = Negotiation.builder()
                .id(UUID.randomUUID())
                .status(NegotiationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .product(product)
                .client(client)
                .seller(seller)
                .proposals(new java.util.ArrayList<>(List.of()))
                .build();
        when(negotiationRepository.findById(negotiation.getId())).thenReturn(Optional.of(negotiation));
        when(negotiationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = negotiationService.updateNegotiation(
                negotiation.getId(),
                new UpdateNegotiationRequest(NegotiationAction.ACCEPT, null),
                seller.getId()
        );
        assertEquals(NegotiationStatus.ACCEPTED, response.status());
    }
}
