package esprit_market.config;

import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Security helper for marketplace operations
 * Used in @PreAuthorize annotations to validate ownership
 */
@Component("marketplaceSecurity")
@RequiredArgsConstructor
public class MarketplaceSecurity {
    
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    
    /**
     * Check if the authenticated user owns the specified shop
     */
    public boolean isShopOwner(Authentication authentication, String shopId) {
        if (authentication == null || shopId == null) {
            return false;
        }
        
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (!userOpt.isPresent()) {
                return false;
            }
            
            ObjectId shopObjectId = new ObjectId(shopId);
            Optional<Shop> shopOpt = shopRepository.findById(shopObjectId);
            if (!shopOpt.isPresent()) {
                return false;
            }
            
            Shop shop = shopOpt.get();
            User user = userOpt.get();
            
            return shop.getOwnerId().equals(user.getId());
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Check if the authenticated user owns the product (via shop ownership)
     */
    public boolean isProductOwner(Authentication authentication, ObjectId productId) {
        if (authentication == null || productId == null) {
            return false;
        }
        
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (!userOpt.isPresent()) {
                return false;
            }
            
            Optional<Product> productOpt = productRepository.findById(productId);
            if (!productOpt.isPresent()) {
                return false;
            }
            
            Product product = productOpt.get();
            User user = userOpt.get();
            
            // Get the shop that owns this product
            Optional<Shop> shopOpt = shopRepository.findById(product.getShopId());
            if (!shopOpt.isPresent()) {
                return false;
            }
            
            Shop shop = shopOpt.get();
            return shop.getOwnerId().equals(user.getId());
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Get the shop ID for the authenticated provider
     */
    public Optional<ObjectId> getProviderShopId(Authentication authentication) {
        if (authentication == null) {
            return Optional.empty();
        }
        
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (!userOpt.isPresent()) {
                return Optional.empty();
            }
            
            User user = userOpt.get();
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(user.getId());
            
            return shopOpt.map(Shop::getId);
        } catch (Exception e) {
            return Optional.empty();
        }
    }
}
