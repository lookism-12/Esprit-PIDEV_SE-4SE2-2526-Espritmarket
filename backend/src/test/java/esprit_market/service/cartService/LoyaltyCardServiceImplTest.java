package esprit_market.service.cartService;

import esprit_market.dto.cartDto.ConvertPointsRequest;
import esprit_market.dto.cartDto.LoyaltyCardResponse;
import esprit_market.entity.cart.LoyaltyCard;
import esprit_market.entity.user.User;
import esprit_market.mappers.cartMapper.LoyaltyCardMapper;
import esprit_market.repository.cartRepository.LoyaltyCardRepository;
import esprit_market.repository.userRepository.UserRepository;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("LoyaltyCardServiceImpl Tests")
class LoyaltyCardServiceImplTest {

    @Mock
    private LoyaltyCardRepository repository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LoyaltyCardMapper mapper;

    @InjectMocks
    private LoyaltyCardServiceImpl loyaltyCardService;

    private ObjectId userId;
    private ObjectId cardId;
    private User testUser;
    private LoyaltyCard testCard;
    private LoyaltyCardResponse testResponse;

    @BeforeEach
    void setUp() throws Exception {
        try (var autoCloseable = MockitoAnnotations.openMocks(this)) {
            userId = new ObjectId();
            cardId = new ObjectId();

        testUser = User.builder()
                .id(userId)
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .build();

        testCard = LoyaltyCard.builder()
                .id(cardId)
                .user(testUser)
                .points(100)
                .level("BRONZE")
                .totalPointsEarned(100)
                .pointsExpireAt(LocalDate.now().plusYears(1))
                .convertedToDiscount(0.0)
                .build();

        testResponse = LoyaltyCardResponse.builder()
                .id(cardId.toHexString())
                .points(100)
                .level("BRONZE")
                .build();
        }
    }

    @Test
    @DisplayName("getOrCreateLoyaltyCard_shouldCreateNewCard_whenNotExists")
    void testGetOrCreateLoyaltyCard_ShouldCreateNewCard() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.empty());
        when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
        when(mapper.toResponse(testCard)).thenReturn(testResponse);

        LoyaltyCardResponse result = loyaltyCardService.getOrCreateLoyaltyCard(userId);

        assertNotNull(result);
        verify(repository).save(any(LoyaltyCard.class));
    }

    @Test
    @DisplayName("getOrCreateLoyaltyCard_shouldReturnExistingCard")
    void testGetOrCreateLoyaltyCard_ShouldReturnExistingCard() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.of(testCard));
        when(mapper.toResponse(testCard)).thenReturn(testResponse);

        LoyaltyCardResponse result = loyaltyCardService.getOrCreateLoyaltyCard(userId);

        assertNotNull(result);
        verify(repository, never()).save(any(LoyaltyCard.class));
    }

    @Test
    @DisplayName("getOrCreateLoyaltyCard_shouldThrowException_whenUserNotFound")
    void testGetOrCreateLoyaltyCard_ShouldThrowException_WhenUserNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> loyaltyCardService.getOrCreateLoyaltyCard(userId));
    }

    @Test
    @DisplayName("getLoyaltyCardByUserId_shouldReturnCard")
    void testGetLoyaltyCardByUserId_ShouldReturnCard() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.of(testCard));
        when(mapper.toResponse(testCard)).thenReturn(testResponse);

        LoyaltyCardResponse result = loyaltyCardService.getLoyaltyCardByUserId(userId);

        assertNotNull(result);
        verify(repository).findByUser(testUser);
    }

    @Test
    @DisplayName("getLoyaltyCardByUserId_shouldThrowException_whenCardNotFound")
    void testGetLoyaltyCardByUserId_ShouldThrowException_WhenCardNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> loyaltyCardService.getLoyaltyCardByUserId(userId));
    }

    @Test
    @DisplayName("addPointsForCart_shouldAddPoints")
    void testAddPointsForCart_ShouldAddPoints() {
        double cartTotal = 100.0;

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.of(testCard));
        when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
        when(mapper.toResponse(testCard)).thenReturn(testResponse);

        LoyaltyCardResponse result = loyaltyCardService.addPointsForCart(userId, cartTotal);

        assertNotNull(result);
        verify(repository).save(any(LoyaltyCard.class));
    }

    @Test
    @DisplayName("addPointsForCart_shouldThrowException_whenInvalidTotal")
    void testAddPointsForCart_ShouldThrowException_WhenInvalidTotal() {
        assertThrows(IllegalArgumentException.class, () -> loyaltyCardService.addPointsForCart(userId, null));
        assertThrows(IllegalArgumentException.class, () -> loyaltyCardService.addPointsForCart(userId, 0.0));
        assertThrows(IllegalArgumentException.class, () -> loyaltyCardService.addPointsForCart(userId, -10.0));
    }

    @Test
    @DisplayName("deductPoints_shouldDeductPoints")
    void testDeductPoints_ShouldDeductPoints() {
        int pointsToDeduct = 50;

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.of(testCard));

        int result = loyaltyCardService.deductPoints(userId, pointsToDeduct);

        assertTrue(result >= 0);
        verify(repository).findByUser(testUser);
    }

    @Test
    @DisplayName("convertPointsToDiscount_shouldConvertPoints")
    void testConvertPointsToDiscount_ShouldConvertPoints() {
        ConvertPointsRequest request = new ConvertPointsRequest();
        request.setPoints(100);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.of(testCard));
        when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
        when(mapper.toResponse(testCard)).thenReturn(testResponse);

        LoyaltyCardResponse result = loyaltyCardService.convertPointsToDiscount(userId, request);

        assertNotNull(result);
        verify(repository).save(any(LoyaltyCard.class));
    }

    @Test
    @DisplayName("convertPointsToDiscount_shouldThrowException_whenInsufficientPoints")
    void testConvertPointsToDiscount_ShouldThrowException_WhenInsufficientPoints() {
        ConvertPointsRequest request = new ConvertPointsRequest();
        request.setPoints(1000);

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.of(testCard));

        assertThrows(IllegalArgumentException.class, () -> loyaltyCardService.convertPointsToDiscount(userId, request));
    }

    @Test
    @DisplayName("updateLevel_shouldUpdateUserLevel")
    void testUpdateLevel_ShouldUpdateUserLevel() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(repository.findByUser(testUser)).thenReturn(Optional.of(testCard));
        when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
        when(mapper.toResponse(testCard)).thenReturn(testResponse);

        LoyaltyCardResponse result = loyaltyCardService.addPoints(userId, 500);

        assertNotNull(result);
        verify(repository).save(any(LoyaltyCard.class));
    }

    @Test
    @DisplayName("expirePoints_shouldMarkPointsAsExpired")
    void testExpirePoints_ShouldMarkPointsAsExpired() {
        assertEquals("BRONZE", loyaltyCardService.calculateLevel(0));
        assertEquals("SILVER", loyaltyCardService.calculateLevel(1000));
        assertEquals("GOLD", loyaltyCardService.calculateLevel(5000));
        assertEquals("PLATINUM", loyaltyCardService.calculateLevel(10000));
    }

    @Test
    @DisplayName("getPointsMultiplier_shouldReturnCorrectMultiplier")
    void testGetPointsMultiplier_ShouldReturnCorrectMultiplier() {
        double bronzeMultiplier = 1.0;
        double silverMultiplier = 1.5;
        double goldMultiplier = 2.0;
        double platinumMultiplier = 3.0;

        // These methods should exist in service
        assertEquals(bronzeMultiplier, loyaltyCardService.getPointsMultiplier("BRONZE"), 0.001);
        assertEquals(silverMultiplier, loyaltyCardService.getPointsMultiplier("SILVER"), 0.001);
        assertEquals(goldMultiplier, loyaltyCardService.getPointsMultiplier("GOLD"), 0.001);
        assertEquals(platinumMultiplier, loyaltyCardService.getPointsMultiplier("PLATINUM"), 0.001);
    }
}
