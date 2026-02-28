package esprit_market.cartTest;

import esprit_market.dto.ConvertPointsRequest;
import esprit_market.dto.LoyaltyCardResponse;
import esprit_market.entity.cart.LoyaltyCard;
import esprit_market.entity.user.User;
import esprit_market.mappers.LoyaltyCardMapper;
import esprit_market.repository.cartRepository.LoyaltyCardRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.LoyaltyCardServiceImpl;
import esprit_market.service.cartService.ResourceNotFoundException;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for LoyaltyCardServiceImpl.
 * Tests loyalty points earning, level calculation, points conversion, and multiplier logic.
 * 
 * Points System:
 * - Base rate: 10 points per currency unit
 * - Multiplier by level: BRONZE(1x), SILVER(1.5x), GOLD(2x), PLATINUM(3x)
 * 
 * Level Thresholds (totalPointsEarned):
 * - BRONZE: 0 - 999
 * - SILVER: 1000 - 4999
 * - GOLD: 5000 - 9999
 * - PLATINUM: 10000+
 * 
 * Points Conversion: 100 points = 1 currency unit discount
 */
@ExtendWith(MockitoExtension.class)
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
    private LoyaltyCard testCard;
    private User testUser;

    @BeforeEach
    void setUp() {
        userId = new ObjectId();

        testUser = new User();
        testUser.setId(userId);

        testCard = LoyaltyCard.builder()
                .id(new ObjectId())
                .userId(userId)
                .points(500)
                .level("BRONZE")
                .totalPointsEarned(500)
                .pointsExpireAt(LocalDate.now().plusYears(1))
                .convertedToDiscount(0.0)
                .build();
    }

    // ==================== GET OR CREATE LOYALTY CARD TESTS ====================

    @Nested
    @DisplayName("getOrCreateLoyaltyCard Tests")
    class GetOrCreateLoyaltyCardTests {

        @Test
        @DisplayName("Should return existing loyalty card")
        void getOrCreateLoyaltyCard_ExistingCard_ReturnsCard() {
            LoyaltyCardResponse expectedResponse = LoyaltyCardResponse.builder()
                    .id(testCard.getId().toHexString())
                    .userId(userId.toHexString())
                    .points(500)
                    .level("BRONZE")
                    .build();

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(mapper.toResponse(testCard)).thenReturn(expectedResponse);

            LoyaltyCardResponse result = loyaltyCardService.getOrCreateLoyaltyCard(userId);

            assertNotNull(result);
            assertEquals(500, result.getPoints());
            assertEquals("BRONZE", result.getLevel());
            verify(repository, never()).save(any(LoyaltyCard.class));
        }

        @Test
        @DisplayName("Should create new loyalty card when none exists")
        void getOrCreateLoyaltyCard_NoExistingCard_CreatesNew() {
            when(repository.findByUserId(userId)).thenReturn(Optional.empty());
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().points(0).level("BRONZE").build());

            LoyaltyCardResponse result = loyaltyCardService.getOrCreateLoyaltyCard(userId);

            assertNotNull(result);
            verify(repository).save(any(LoyaltyCard.class));
            verify(userRepository).save(any(User.class));
        }
    }

    // ==================== ADD POINTS FOR CART TESTS ====================

    @Nested
    @DisplayName("addPointsForCart Tests")
    class AddPointsForCartTests {

        @Test
        @DisplayName("Should add points with BRONZE multiplier (1.0x)")
        void addPointsForCart_BronzeLevel_Correct() {
            testCard.setLevel("BRONZE");
            testCard.setPoints(0);
            testCard.setTotalPointsEarned(0);

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().points(1000).build());

            // Cart total of 100 with BRONZE (1x) = 100 * 10 * 1.0 = 1000 points
            LoyaltyCardResponse result = loyaltyCardService.addPointsForCart(userId, 100.0);

            assertNotNull(result);
            verify(repository).save(argThat(card -> card.getPoints() == 1000));
        }

        @Test
        @DisplayName("Should add points with SILVER multiplier (1.5x)")
        void addPointsForCart_SilverLevel_Correct() {
            testCard.setLevel("SILVER");
            testCard.setPoints(1000);
            testCard.setTotalPointsEarned(1000);

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().points(2500).build());

            // Cart total of 100 with SILVER (1.5x) = 100 * 10 * 1.5 = 1500 points
            // Total = 1000 + 1500 = 2500
            loyaltyCardService.addPointsForCart(userId, 100.0);

            verify(repository).save(argThat(card -> card.getPoints() == 2500));
        }

        @Test
        @DisplayName("Should add points with GOLD multiplier (2.0x)")
        void addPointsForCart_GoldLevel_Correct() {
            testCard.setLevel("GOLD");
            testCard.setPoints(5000);
            testCard.setTotalPointsEarned(5000);

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().points(7000).build());

            // Cart total of 100 with GOLD (2x) = 100 * 10 * 2.0 = 2000 points
            // Total = 5000 + 2000 = 7000
            loyaltyCardService.addPointsForCart(userId, 100.0);

            verify(repository).save(argThat(card -> card.getPoints() == 7000));
        }

        @Test
        @DisplayName("Should add points with PLATINUM multiplier (3.0x)")
        void addPointsForCart_PlatinumLevel_Correct() {
            testCard.setLevel("PLATINUM");
            testCard.setPoints(10000);
            testCard.setTotalPointsEarned(10000);

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().points(13000).build());

            // Cart total of 100 with PLATINUM (3x) = 100 * 10 * 3.0 = 3000 points
            // Total = 10000 + 3000 = 13000
            loyaltyCardService.addPointsForCart(userId, 100.0);

            verify(repository).save(argThat(card -> card.getPoints() == 13000));
        }

        @Test
        @DisplayName("Should throw exception for null cart total")
        void addPointsForCart_NullTotal_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.addPointsForCart(userId, null));
        }

        @Test
        @DisplayName("Should throw exception for zero cart total")
        void addPointsForCart_ZeroTotal_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.addPointsForCart(userId, 0.0));
        }

        @Test
        @DisplayName("Should throw exception for negative cart total")
        void addPointsForCart_NegativeTotal_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.addPointsForCart(userId, -100.0));
        }

        @Test
        @DisplayName("Should update expiration date on points addition")
        void addPointsForCart_UpdatesExpirationDate() {
            testCard.setPointsExpireAt(LocalDate.now().minusDays(30));

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().build());

            loyaltyCardService.addPointsForCart(userId, 100.0);

            verify(repository).save(argThat(card -> 
                    card.getPointsExpireAt().isAfter(LocalDate.now())));
        }
    }

    // ==================== LEVEL CALCULATION TESTS ====================

    @Nested
    @DisplayName("calculateLevel Tests")
    class CalculateLevelTests {

        @Test
        @DisplayName("Should return BRONZE for 0 points")
        void calculateLevel_ZeroPoints_Bronze() {
            String result = loyaltyCardService.calculateLevel(0);
            assertEquals("BRONZE", result);
        }

        @Test
        @DisplayName("Should return BRONZE for 999 points")
        void calculateLevel_999Points_Bronze() {
            String result = loyaltyCardService.calculateLevel(999);
            assertEquals("BRONZE", result);
        }

        @Test
        @DisplayName("Should return SILVER for 1000 points")
        void calculateLevel_1000Points_Silver() {
            String result = loyaltyCardService.calculateLevel(1000);
            assertEquals("SILVER", result);
        }

        @Test
        @DisplayName("Should return SILVER for 4999 points")
        void calculateLevel_4999Points_Silver() {
            String result = loyaltyCardService.calculateLevel(4999);
            assertEquals("SILVER", result);
        }

        @Test
        @DisplayName("Should return GOLD for 5000 points")
        void calculateLevel_5000Points_Gold() {
            String result = loyaltyCardService.calculateLevel(5000);
            assertEquals("GOLD", result);
        }

        @Test
        @DisplayName("Should return GOLD for 9999 points")
        void calculateLevel_9999Points_Gold() {
            String result = loyaltyCardService.calculateLevel(9999);
            assertEquals("GOLD", result);
        }

        @Test
        @DisplayName("Should return PLATINUM for 10000 points")
        void calculateLevel_10000Points_Platinum() {
            String result = loyaltyCardService.calculateLevel(10000);
            assertEquals("PLATINUM", result);
        }

        @Test
        @DisplayName("Should return PLATINUM for very high points")
        void calculateLevel_HighPoints_Platinum() {
            String result = loyaltyCardService.calculateLevel(100000);
            assertEquals("PLATINUM", result);
        }

        @Test
        @DisplayName("Should return BRONZE for null points")
        void calculateLevel_NullPoints_Bronze() {
            String result = loyaltyCardService.calculateLevel(null);
            assertEquals("BRONZE", result);
        }
    }

    // ==================== POINTS MULTIPLIER TESTS ====================

    @Nested
    @DisplayName("getPointsMultiplier Tests")
    class GetPointsMultiplierTests {

        @Test
        @DisplayName("Should return 1.0 for BRONZE")
        void getPointsMultiplier_Bronze_Returns1() {
            double result = loyaltyCardService.getPointsMultiplier("BRONZE");
            assertEquals(1.0, result, 0.01);
        }

        @Test
        @DisplayName("Should return 1.5 for SILVER")
        void getPointsMultiplier_Silver_Returns1_5() {
            double result = loyaltyCardService.getPointsMultiplier("SILVER");
            assertEquals(1.5, result, 0.01);
        }

        @Test
        @DisplayName("Should return 2.0 for GOLD")
        void getPointsMultiplier_Gold_Returns2() {
            double result = loyaltyCardService.getPointsMultiplier("GOLD");
            assertEquals(2.0, result, 0.01);
        }

        @Test
        @DisplayName("Should return 3.0 for PLATINUM")
        void getPointsMultiplier_Platinum_Returns3() {
            double result = loyaltyCardService.getPointsMultiplier("PLATINUM");
            assertEquals(3.0, result, 0.01);
        }

        @Test
        @DisplayName("Should return 1.0 for null level")
        void getPointsMultiplier_NullLevel_Returns1() {
            double result = loyaltyCardService.getPointsMultiplier(null);
            assertEquals(1.0, result, 0.01);
        }

        @Test
        @DisplayName("Should return 1.0 for unknown level")
        void getPointsMultiplier_UnknownLevel_Returns1() {
            double result = loyaltyCardService.getPointsMultiplier("DIAMOND");
            assertEquals(1.0, result, 0.01);
        }

        @Test
        @DisplayName("Should handle lowercase level")
        void getPointsMultiplier_LowercaseLevel_Success() {
            double result = loyaltyCardService.getPointsMultiplier("gold");
            assertEquals(2.0, result, 0.01);
        }
    }

    // ==================== CONVERT POINTS TO DISCOUNT TESTS ====================

    @Nested
    @DisplayName("convertPointsToDiscount Tests")
    class ConvertPointsToDiscountTests {

        @Test
        @DisplayName("Should convert 100 points to 1 currency unit")
        void convertPointsToDiscount_100Points_1Unit() {
            testCard.setPoints(1000);
            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(100)
                    .build();

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().points(900).convertedToDiscount(1.0).build());

            LoyaltyCardResponse result = loyaltyCardService.convertPointsToDiscount(userId, request);

            assertNotNull(result);
            verify(repository).save(argThat(card -> 
                    card.getPoints() == 900 && card.getConvertedToDiscount() == 1.0));
        }

        @Test
        @DisplayName("Should convert 500 points to 5 currency units")
        void convertPointsToDiscount_500Points_5Units() {
            testCard.setPoints(1000);
            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(500)
                    .build();

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().build());

            loyaltyCardService.convertPointsToDiscount(userId, request);

            verify(repository).save(argThat(card -> 
                    card.getPoints() == 500 && card.getConvertedToDiscount() == 5.0));
        }

        @Test
        @DisplayName("Should throw exception for insufficient points")
        void convertPointsToDiscount_InsufficientPoints_ThrowsException() {
            testCard.setPoints(50);
            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(100)
                    .build();

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));

            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.convertPointsToDiscount(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for points not in multiples of 100")
        void convertPointsToDiscount_NotMultipleOf100_ThrowsException() {
            testCard.setPoints(1000);
            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(150)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.convertPointsToDiscount(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for null points")
        void convertPointsToDiscount_NullPoints_ThrowsException() {
            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(null)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.convertPointsToDiscount(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for zero points")
        void convertPointsToDiscount_ZeroPoints_ThrowsException() {
            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(0)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.convertPointsToDiscount(userId, request));
        }

        @Test
        @DisplayName("Should throw exception for negative points")
        void convertPointsToDiscount_NegativePoints_ThrowsException() {
            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(-100)
                    .build();

            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.convertPointsToDiscount(userId, request));
        }

        @Test
        @DisplayName("Should throw exception when loyalty card not found")
        void convertPointsToDiscount_CardNotFound_ThrowsException() {
            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(100)
                    .build();

            when(repository.findByUserId(userId)).thenReturn(Optional.empty());

            assertThrows(ResourceNotFoundException.class,
                    () -> loyaltyCardService.convertPointsToDiscount(userId, request));
        }
    }

    // ==================== DEDUCT POINTS TESTS ====================

    @Nested
    @DisplayName("deductPoints Tests")
    class DeductPointsTests {

        @Test
        @DisplayName("Should deduct full amount when sufficient points")
        void deductPoints_SufficientPoints_DeductsAll() {
            testCard.setPoints(500);

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);

            int result = loyaltyCardService.deductPoints(userId, 200);

            assertEquals(200, result);
            verify(repository).save(argThat(card -> card.getPoints() == 300));
        }

        @Test
        @DisplayName("Should deduct available points when insufficient")
        void deductPoints_InsufficientPoints_DeductsAvailable() {
            testCard.setPoints(100);

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);

            int result = loyaltyCardService.deductPoints(userId, 500);

            assertEquals(100, result);
            verify(repository).save(argThat(card -> card.getPoints() == 0));
        }

        @Test
        @DisplayName("Should return 0 when no card exists")
        void deductPoints_NoCard_Returns0() {
            when(repository.findByUserId(userId)).thenReturn(Optional.empty());

            int result = loyaltyCardService.deductPoints(userId, 100);

            assertEquals(0, result);
            verify(repository, never()).save(any(LoyaltyCard.class));
        }

        @Test
        @DisplayName("Should return 0 for null points to deduct")
        void deductPoints_NullPoints_Returns0() {
            int result = loyaltyCardService.deductPoints(userId, null);
            assertEquals(0, result);
        }

        @Test
        @DisplayName("Should return 0 for zero points to deduct")
        void deductPoints_ZeroPoints_Returns0() {
            int result = loyaltyCardService.deductPoints(userId, 0);
            assertEquals(0, result);
        }

        @Test
        @DisplayName("Should return 0 for negative points to deduct")
        void deductPoints_NegativePoints_Returns0() {
            int result = loyaltyCardService.deductPoints(userId, -100);
            assertEquals(0, result);
        }
    }

    // ==================== CALCULATE POINTS FOR AMOUNT TESTS ====================

    @Nested
    @DisplayName("calculatePointsForAmount Tests")
    class CalculatePointsForAmountTests {

        @Test
        @DisplayName("Should calculate points with BRONZE multiplier")
        void calculatePointsForAmount_Bronze_Correct() {
            testCard.setLevel("BRONZE");

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));

            // 100 * 10 * 1.0 = 1000
            int result = loyaltyCardService.calculatePointsForAmount(userId, 100.0);

            assertEquals(1000, result);
        }

        @Test
        @DisplayName("Should calculate points with PLATINUM multiplier")
        void calculatePointsForAmount_Platinum_Correct() {
            testCard.setLevel("PLATINUM");

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));

            // 100 * 10 * 3.0 = 3000
            int result = loyaltyCardService.calculatePointsForAmount(userId, 100.0);

            assertEquals(3000, result);
        }

        @Test
        @DisplayName("Should return 0 for null amount")
        void calculatePointsForAmount_NullAmount_Returns0() {
            int result = loyaltyCardService.calculatePointsForAmount(userId, null);
            assertEquals(0, result);
        }

        @Test
        @DisplayName("Should return 0 for zero amount")
        void calculatePointsForAmount_ZeroAmount_Returns0() {
            int result = loyaltyCardService.calculatePointsForAmount(userId, 0.0);
            assertEquals(0, result);
        }

        @Test
        @DisplayName("Should return 0 for negative amount")
        void calculatePointsForAmount_NegativeAmount_Returns0() {
            int result = loyaltyCardService.calculatePointsForAmount(userId, -100.0);
            assertEquals(0, result);
        }

        @Test
        @DisplayName("Should use BRONZE multiplier when no card exists")
        void calculatePointsForAmount_NoCard_UsesBronze() {
            when(repository.findByUserId(userId)).thenReturn(Optional.empty());

            // 100 * 10 * 1.0 = 1000
            int result = loyaltyCardService.calculatePointsForAmount(userId, 100.0);

            assertEquals(1000, result);
        }
    }

    // ==================== ADD POINTS TESTS ====================

    @Nested
    @DisplayName("addPoints Tests")
    class AddPointsTests {

        @Test
        @DisplayName("Should add points successfully")
        void addPoints_ValidPoints_Success() {
            testCard.setPoints(100);
            testCard.setTotalPointsEarned(100);

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().points(600).build());

            LoyaltyCardResponse result = loyaltyCardService.addPoints(userId, 500);

            assertNotNull(result);
            verify(repository).save(argThat(card -> 
                    card.getPoints() == 600 && card.getTotalPointsEarned() == 600));
        }

        @Test
        @DisplayName("Should update level after adding points")
        void addPoints_UpdatesLevel() {
            testCard.setPoints(800);
            testCard.setTotalPointsEarned(800);
            testCard.setLevel("BRONZE");

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().level("SILVER").build());

            // Adding 500 points makes total 1300 which is SILVER level
            loyaltyCardService.addPoints(userId, 500);

            verify(repository).save(argThat(card -> "SILVER".equals(card.getLevel())));
        }

        @Test
        @DisplayName("Should throw exception for null points")
        void addPoints_NullPoints_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.addPoints(userId, null));
        }

        @Test
        @DisplayName("Should throw exception for zero points")
        void addPoints_ZeroPoints_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.addPoints(userId, 0));
        }

        @Test
        @DisplayName("Should throw exception for negative points")
        void addPoints_NegativePoints_ThrowsException() {
            assertThrows(IllegalArgumentException.class,
                    () -> loyaltyCardService.addPoints(userId, -100));
        }
    }

    // ==================== LEVEL PROGRESSION EDGE CASES ====================

    @Nested
    @DisplayName("Level Progression Edge Cases")
    class LevelProgressionTests {

        @Test
        @DisplayName("Should upgrade from BRONZE to SILVER at 1000 points")
        void levelProgression_BronzeToSilver() {
            testCard.setPoints(900);
            testCard.setTotalPointsEarned(900);
            testCard.setLevel("BRONZE");

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().build());

            loyaltyCardService.addPoints(userId, 100);

            verify(repository).save(argThat(card -> 
                    "SILVER".equals(card.getLevel()) && card.getTotalPointsEarned() == 1000));
        }

        @Test
        @DisplayName("Should upgrade from SILVER to GOLD at 5000 points")
        void levelProgression_SilverToGold() {
            testCard.setPoints(4900);
            testCard.setTotalPointsEarned(4900);
            testCard.setLevel("SILVER");

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().build());

            loyaltyCardService.addPoints(userId, 100);

            verify(repository).save(argThat(card -> 
                    "GOLD".equals(card.getLevel()) && card.getTotalPointsEarned() == 5000));
        }

        @Test
        @DisplayName("Should upgrade from GOLD to PLATINUM at 10000 points")
        void levelProgression_GoldToPlatinum() {
            testCard.setPoints(9900);
            testCard.setTotalPointsEarned(9900);
            testCard.setLevel("GOLD");

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().build());

            loyaltyCardService.addPoints(userId, 100);

            verify(repository).save(argThat(card -> 
                    "PLATINUM".equals(card.getLevel()) && card.getTotalPointsEarned() == 10000));
        }

        @Test
        @DisplayName("Should not downgrade level after points conversion")
        void levelProgression_NoDowngradeAfterConversion() {
            // Even if points drop below threshold, level should not change
            // because level is based on totalPointsEarned, not current points
            testCard.setPoints(2000);
            testCard.setTotalPointsEarned(5000);
            testCard.setLevel("GOLD");

            ConvertPointsRequest request = ConvertPointsRequest.builder()
                    .points(1500)
                    .build();

            when(repository.findByUserId(userId)).thenReturn(Optional.of(testCard));
            when(repository.save(any(LoyaltyCard.class))).thenReturn(testCard);
            when(mapper.toResponse(any(LoyaltyCard.class)))
                    .thenReturn(LoyaltyCardResponse.builder().build());

            loyaltyCardService.convertPointsToDiscount(userId, request);

            // Level remains GOLD because totalPointsEarned hasn't changed
            verify(repository).save(argThat(card -> 
                    card.getPoints() == 500 && card.getTotalPointsEarned() == 5000));
        }
    }
}
