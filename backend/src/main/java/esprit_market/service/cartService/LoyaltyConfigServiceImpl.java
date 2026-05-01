package esprit_market.service.cartService;

import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.dto.cartDto.LoyaltyConfigDTO;
import esprit_market.entity.cart.LoyaltyConfig;
import esprit_market.repository.cartRepository.LoyaltyConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyConfigServiceImpl implements ILoyaltyConfigService {
    
    private final LoyaltyConfigRepository repository;
    
    // ==================== REDESIGNED DEFAULT VALUES ====================
    // 🎯 REALISTIC POINTS SYSTEM: 1 TND = 1 Point (1:1 ratio)
    // This creates intuitive, user-friendly values that customers can easily understand
    
    /**
     * Base rate: 1 point per 1 TND spent (100% conversion)
     * Range: 0.5 - 2.0 (50% to 200% conversion)
     * Default: 1.0 (1:1 ratio - easy to understand)
     */
    private static final double DEFAULT_BASE_RATE = 1.0;
    
    /**
     * Tier thresholds based on realistic spending patterns
     * SILVER: 1,000 points (≈ 1,000 TND spent)
     * GOLD: 5,000 points (≈ 5,000 TND spent) 
     * PLATINUM: 15,000 points (≈ 15,000 TND spent)
     */
    private static final int DEFAULT_SILVER_THRESHOLD = 1000;
    private static final int DEFAULT_GOLD_THRESHOLD = 5000;
    private static final int DEFAULT_PLATINUM_THRESHOLD = 15000;
    
    /**
     * Tier multipliers - progressive rewards for loyalty
     * BRONZE: 1.0x (baseline)
     * SILVER: 1.2x (+20% bonus)
     * GOLD: 1.5x (+50% bonus)
     * PLATINUM: 2.0x (+100% bonus)
     */
    private static final double DEFAULT_BRONZE_MULTIPLIER = 1.0;
    private static final double DEFAULT_SILVER_MULTIPLIER = 1.2;
    private static final double DEFAULT_GOLD_MULTIPLIER = 1.5;
    private static final double DEFAULT_PLATINUM_MULTIPLIER = 2.0;
    
    /**
     * Bonus rewards for engagement
     * Quantity bonus: 50 points for 5+ items (encourages bulk purchases)
     * High-value bonus: 100 points for 200+ TND orders (rewards big spenders)
     */
    private static final int DEFAULT_BONUS_QUANTITY = 50;
    private static final int DEFAULT_BONUS_QUANTITY_THRESHOLD = 5;
    private static final int DEFAULT_BONUS_HIGH_ORDER = 100;
    private static final double DEFAULT_BONUS_HIGH_ORDER_THRESHOLD = 200.0;
    
    /**
     * Usage limits and conversion rates
     * Max points per order: 500 points (prevents abuse)
     * Conversion rate: 0.1 (10 points = 1 TND discount)
     */
    private static final int DEFAULT_MAX_POINTS_PER_ORDER = 500;
    private static final double DEFAULT_POINTS_TO_CURRENCY_RATE = 0.1;
    
    // ==================== INITIALIZATION ====================
    
    @PostConstruct
    public void ensureDefaultConfigExists() {
        if (repository.findByActiveTrue().isEmpty()) {
            log.warn("⚠️ No active loyalty config found on startup. Creating default configuration...");
            createDefaultConfig();
        } else {
            log.info("✅ Active loyalty configuration found on startup");
        }
    }
    
    // ==================== CORE METHODS ====================
    
    @Override
    @Cacheable(value = "loyaltyConfig", key = "'active'")
    public LoyaltyConfig getActiveConfig() {
        log.debug("📥 Loading loyalty config from database...");
        
        return repository.findByActiveTrue()
                .orElseThrow(() -> new IllegalStateException(
                    "No active loyalty configuration found. Please initialize default config."
                ));
    }
    
    @Override
    public LoyaltyConfigDTO getActiveConfigDTO() {
        LoyaltyConfig config = getActiveConfig();
        return toDTO(config);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = "loyaltyConfig", allEntries = true)
    public LoyaltyConfigDTO updateConfig(LoyaltyConfigDTO dto, String adminUsername) {
        log.info("🔧 Admin '{}' is updating loyalty configuration", adminUsername);
        log.info("🗑️ Evicting loyalty config cache...");
        
        // Validate business rules
        validateConfig(dto);
        
        // Deactivate ALL existing configs to ensure single source of truth
        java.util.List<LoyaltyConfig> allConfigs = repository.findAll();
        allConfigs.forEach(config -> {
            config.setActive(false);
            repository.save(config);
        });
        log.info("🔄 Deactivated {} existing config(s)", allConfigs.size());
        
        // Create new config
        LoyaltyConfig newConfig = LoyaltyConfig.builder()
                .baseRate(dto.getBaseRate())
                .maxPointsPerOrder(dto.getMaxPointsPerOrder())
                .pointsToCurrencyRate(dto.getPointsToCurrencyRate())
                .silverThreshold(dto.getSilverThreshold())
                .goldThreshold(dto.getGoldThreshold())
                .platinumThreshold(dto.getPlatinumThreshold())
                .bronzeMultiplier(dto.getBronzeMultiplier())
                .silverMultiplier(dto.getSilverMultiplier())
                .goldMultiplier(dto.getGoldMultiplier())
                .platinumMultiplier(dto.getPlatinumMultiplier())
                .bonusQuantity(dto.getBonusQuantity())
                .bonusQuantityThreshold(dto.getBonusQuantityThreshold())
                .bonusHighOrder(dto.getBonusHighOrder())
                .bonusHighOrderThreshold(dto.getBonusHighOrderThreshold())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .updatedBy(adminUsername)
                .active(true)
                .build();
        
        LoyaltyConfig saved = repository.save(newConfig);
        log.info("✅ New loyalty config saved: {}", saved.getId());
        
        return toDTO(saved);
    }
    
    @Override
    @Transactional
    public LoyaltyConfig createDefaultConfig() {
        log.info("🏗️ Creating default loyalty configuration...");
        
        LoyaltyConfig defaultConfig = LoyaltyConfig.builder()
                .baseRate(DEFAULT_BASE_RATE)
                .maxPointsPerOrder(DEFAULT_MAX_POINTS_PER_ORDER)
                .pointsToCurrencyRate(DEFAULT_POINTS_TO_CURRENCY_RATE)
                .silverThreshold(DEFAULT_SILVER_THRESHOLD)
                .goldThreshold(DEFAULT_GOLD_THRESHOLD)
                .platinumThreshold(DEFAULT_PLATINUM_THRESHOLD)
                .bronzeMultiplier(DEFAULT_BRONZE_MULTIPLIER)
                .silverMultiplier(DEFAULT_SILVER_MULTIPLIER)
                .goldMultiplier(DEFAULT_GOLD_MULTIPLIER)
                .platinumMultiplier(DEFAULT_PLATINUM_MULTIPLIER)
                .bonusQuantity(DEFAULT_BONUS_QUANTITY)
                .bonusQuantityThreshold(DEFAULT_BONUS_QUANTITY_THRESHOLD)
                .bonusHighOrder(DEFAULT_BONUS_HIGH_ORDER)
                .bonusHighOrderThreshold(DEFAULT_BONUS_HIGH_ORDER_THRESHOLD)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .updatedBy("SYSTEM")
                .active(true)
                .build();
        
        return repository.save(defaultConfig);
    }
    
    @Override
    @CacheEvict(value = "loyaltyConfig", allEntries = true)
    public void refreshCache() {
        log.info("🔄 Loyalty config cache refreshed");
    }
    
    @Override
    public void validateConfig(LoyaltyConfigDTO dto) {
        // Validate base rate range
        if (dto.getBaseRate() < 0.5 || dto.getBaseRate() > 2.0) {
            throw new IllegalArgumentException("Base rate must be between 0.5 and 2.0");
        }
        
        // Validate points to currency rate
        if (dto.getPointsToCurrencyRate() != null && 
            (dto.getPointsToCurrencyRate() < 0.05 || dto.getPointsToCurrencyRate() > 0.2)) {
            throw new IllegalArgumentException("Points to currency rate must be between 0.05 and 0.2");
        }
        
        // Validate max points per order
        if (dto.getMaxPointsPerOrder() != null && 
            (dto.getMaxPointsPerOrder() < 100 || dto.getMaxPointsPerOrder() > 2000)) {
            throw new IllegalArgumentException("Max points per order must be between 100 and 2000");
        }
        
        // Validate thresholds are increasing
        if (dto.getSilverThreshold() >= dto.getGoldThreshold()) {
            throw new IllegalArgumentException("Gold threshold must be greater than Silver threshold");
        }
        
        if (dto.getGoldThreshold() >= dto.getPlatinumThreshold()) {
            throw new IllegalArgumentException("Platinum threshold must be greater than Gold threshold");
        }
        
        // Validate multipliers are increasing
        if (dto.getBronzeMultiplier() > dto.getSilverMultiplier()) {
            throw new IllegalArgumentException("Silver multiplier must be >= Bronze multiplier");
        }
        
        if (dto.getSilverMultiplier() > dto.getGoldMultiplier()) {
            throw new IllegalArgumentException("Gold multiplier must be >= Silver multiplier");
        }
        
        if (dto.getGoldMultiplier() > dto.getPlatinumMultiplier()) {
            throw new IllegalArgumentException("Platinum multiplier must be >= Gold multiplier");
        }
        
        log.info("✅ Loyalty config validation passed");
    }
    
    // ==================== HELPER METHODS ====================
    
    private LoyaltyConfigDTO toDTO(LoyaltyConfig config) {
        return LoyaltyConfigDTO.builder()
                .id(config.getId() != null ? config.getId().toHexString() : null)
                .baseRate(config.getBaseRate())
                .maxPointsPerOrder(config.getMaxPointsPerOrder())
                .pointsToCurrencyRate(config.getPointsToCurrencyRate())
                .silverThreshold(config.getSilverThreshold())
                .goldThreshold(config.getGoldThreshold())
                .platinumThreshold(config.getPlatinumThreshold())
                .bronzeMultiplier(config.getBronzeMultiplier())
                .silverMultiplier(config.getSilverMultiplier())
                .goldMultiplier(config.getGoldMultiplier())
                .platinumMultiplier(config.getPlatinumMultiplier())
                .bonusQuantity(config.getBonusQuantity())
                .bonusQuantityThreshold(config.getBonusQuantityThreshold())
                .bonusHighOrder(config.getBonusHighOrder())
                .bonusHighOrderThreshold(config.getBonusHighOrderThreshold())
                .createdAt(config.getCreatedAt())
                .updatedAt(config.getUpdatedAt())
                .updatedBy(config.getUpdatedBy())
                .active(config.getActive())
                .build();
    }
}
