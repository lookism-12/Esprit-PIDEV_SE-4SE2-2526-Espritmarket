package esprit_market.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cache Configuration for Loyalty System
 * Uses in-memory caching for loyalty configuration
 */
@Configuration
@EnableCaching
public class CacheConfig {
    
    /**
     * Configure cache manager for loyalty configuration
     * Uses simple in-memory cache (ConcurrentHashMap)
     */
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("loyaltyConfig");
    }
}
