package esprit_market.service.cartService;

import esprit_market.dto.cartDto.LoyaltyConfigDTO;
import esprit_market.entity.cart.LoyaltyConfig;

/**
 * Service interface for managing dynamic loyalty configuration
 */
public interface ILoyaltyConfigService {
    
    /**
     * Get the active loyalty configuration
     * Returns default config if none exists in database
     */
    LoyaltyConfig getActiveConfig();
    
    /**
     * Get the active loyalty configuration as DTO
     */
    LoyaltyConfigDTO getActiveConfigDTO();
    
    /**
     * Update the loyalty configuration
     * Validates business rules before saving
     */
    LoyaltyConfigDTO updateConfig(LoyaltyConfigDTO dto, String adminUsername);
    
    /**
     * Create default configuration if none exists
     */
    LoyaltyConfig createDefaultConfig();
    
    /**
     * Refresh the cached configuration
     * Should be called after updates
     */
    void refreshCache();
    
    /**
     * Validate configuration business rules
     */
    void validateConfig(LoyaltyConfigDTO dto);
}
