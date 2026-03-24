package esprit_market.service.cartService;

import esprit_market.dto.cartDto.ConvertPointsRequest;
import esprit_market.dto.cartDto.LoyaltyCardResponse;
import esprit_market.entity.cart.LoyaltyCard;
import esprit_market.entity.user.User;
import esprit_market.mappers.cartMapper.LoyaltyCardMapper;
import esprit_market.repository.cartRepository.LoyaltyCardRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class LoyaltyCardServiceImpl implements ILoyaltyCardService {
    private final LoyaltyCardRepository repository;
    private final UserRepository userRepository;
    private final LoyaltyCardMapper mapper;
    
    private static final int POINTS_PER_CURRENCY_UNIT = 10;
    private static final int POINTS_TO_DISCOUNT_RATIO = 100;
    
    private static final double BRONZE_MULTIPLIER = 1.0;
    private static final double SILVER_MULTIPLIER = 1.5;
    private static final double GOLD_MULTIPLIER = 2.0;
    private static final double PLATINUM_MULTIPLIER = 3.0;

    @Override
    @Transactional
    public LoyaltyCardResponse getOrCreateLoyaltyCard(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
        return mapper.toResponse(card);
    }

    @Override
    public LoyaltyCardResponse getLoyaltyCardByUserId(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Loyalty card not found for user"));
        return mapper.toResponse(card);
    }
    
    private LoyaltyCard createNewLoyaltyCard(User user) {
        LoyaltyCard card = LoyaltyCard.builder()
            .user(user)
            .points(0)
            .level("BRONZE")
            .totalPointsEarned(0)
            .pointsExpireAt(LocalDate.now().plusYears(1))
            .convertedToDiscount(0.0)
            .build();
        
        return repository.save(card);
    }

    @Override
    @Transactional
    public LoyaltyCardResponse addPointsForCart(ObjectId userId, Double cartTotal) {
        if (cartTotal == null || cartTotal <= 0) {
            throw new IllegalArgumentException("Invalid cart total");
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
        
        double multiplier = getPointsMultiplier(card.getLevel());
        int earnedPoints = (int) (cartTotal * POINTS_PER_CURRENCY_UNIT * multiplier);
        
        card.setPoints(card.getPoints() + earnedPoints);
        card.setTotalPointsEarned(card.getTotalPointsEarned() + earnedPoints);
        card.setLevel(calculateLevel(card.getTotalPointsEarned()));
        card.setPointsExpireAt(LocalDate.now().plusYears(1));
        
        LoyaltyCard updated = repository.save(card);
        return mapper.toResponse(updated);
    }

    @Override
    @Transactional
    public LoyaltyCardResponse convertPointsToDiscount(ObjectId userId, ConvertPointsRequest request) {
        if (request.getPoints() == null || request.getPoints() <= 0) {
            throw new IllegalArgumentException("Points to convert must be greater than 0");
        }
        
        if (request.getPoints() % POINTS_TO_DISCOUNT_RATIO != 0) {
            throw new IllegalArgumentException("Points must be in multiples of " + POINTS_TO_DISCOUNT_RATIO);
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Loyalty card not found"));
        
        if (card.getPoints() < request.getPoints()) {
            throw new IllegalArgumentException("Insufficient points. Available: " + card.getPoints());
        }
        
        double discountValue = request.getPoints() / (double) POINTS_TO_DISCOUNT_RATIO;
        
        card.setPoints(card.getPoints() - request.getPoints());
        card.setConvertedToDiscount(
            (card.getConvertedToDiscount() != null ? card.getConvertedToDiscount() : 0.0) + discountValue
        );
        
        LoyaltyCard updated = repository.save(card);
        return mapper.toResponse(updated);
    }

    @Override
    @Transactional
    public LoyaltyCardResponse addPoints(ObjectId userId, Integer points) {
        if (points == null || points <= 0) {
            throw new IllegalArgumentException("Points must be greater than 0");
        }
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        LoyaltyCard card = repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
        
        card.setPoints(card.getPoints() + points);
        card.setTotalPointsEarned(card.getTotalPointsEarned() + points);
        card.setLevel(calculateLevel(card.getTotalPointsEarned()));
        
        LoyaltyCard updated = repository.save(card);
        return mapper.toResponse(updated);
    }

    @Override
    public String calculateLevel(Integer totalPoints) {
        if (totalPoints == null) return "BRONZE";
        
        if (totalPoints >= 10000) {
            return "PLATINUM";
        } else if (totalPoints >= 5000) {
            return "GOLD";
        } else if (totalPoints >= 1000) {
            return "SILVER";
        } else {
            return "BRONZE";
        }
    }
    
    @Override
    public double getPointsMultiplier(String level) {
        if (level == null) return BRONZE_MULTIPLIER;
        
        return switch (level.toUpperCase()) {
            case "PLATINUM" -> PLATINUM_MULTIPLIER;
            case "GOLD" -> GOLD_MULTIPLIER;
            case "SILVER" -> SILVER_MULTIPLIER;
            default -> BRONZE_MULTIPLIER;
        };
    }
    
    @Override
    @Transactional
    public int deductPoints(ObjectId userId, Integer pointsToDeduct) {
        if (pointsToDeduct == null || pointsToDeduct <= 0) {
            return 0;
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return 0;
        }
        
        LoyaltyCard card = repository.findByUser(user).orElse(null);
        if (card == null) {
            return 0;
        }
        
        int currentPoints = card.getPoints() != null ? card.getPoints() : 0;
        int actualDeduction = Math.min(currentPoints, pointsToDeduct);
        
        if (actualDeduction > 0) {
            card.setPoints(currentPoints - actualDeduction);
            repository.save(card);
        }
        
        return actualDeduction;
    }
    
    @Override
    public int calculatePointsForAmount(ObjectId userId, Double amount) {
        if (amount == null || amount <= 0) {
            return 0;
        }
        
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return (int) (amount * POINTS_PER_CURRENCY_UNIT * BRONZE_MULTIPLIER);
        }
        
        LoyaltyCard card = repository.findByUser(user).orElse(null);
        String level = (card != null) ? card.getLevel() : "BRONZE";
        double multiplier = getPointsMultiplier(level);
        
        return (int) (amount * POINTS_PER_CURRENCY_UNIT * multiplier);
    }
    
    public LoyaltyCard getOrCreateLoyaltyCardEntity(ObjectId userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return repository.findByUser(user)
            .orElseGet(() -> createNewLoyaltyCard(user));
    }
}
