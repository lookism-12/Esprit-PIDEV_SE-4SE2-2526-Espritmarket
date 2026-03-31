package esprit_market.security;

import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("marketplaceSecurity")
@RequiredArgsConstructor
public class MarketplaceSecurityService {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final ServiceRepository serviceRepository;

    private Optional<User> getAuthenticatedUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) return Optional.empty();
        return userRepository.findByEmail(authentication.getName());
    }

    public boolean isShopOwner(Authentication authentication, String shopId) {
        if (shopId == null || shopId.isEmpty()) return false;
        return getAuthenticatedUser(authentication)
                .flatMap(user -> shopRepository.findById(new ObjectId(shopId))
                        .map(shop -> shop.getOwnerId().equals(user.getId())))
                .orElse(false);
    }
    
    public boolean isShopOwnerByObjectId(Authentication authentication, ObjectId shopId) {
        if (shopId == null) return false;
        return getAuthenticatedUser(authentication)
                .flatMap(user -> shopRepository.findById(shopId)
                        .map(shop -> shop.getOwnerId().equals(user.getId())))
                .orElse(false);
    }

    public boolean isProductOwner(Authentication authentication, ObjectId productId) {
        return getAuthenticatedUser(authentication)
                .flatMap(user -> productRepository.findById(productId)
                        .flatMap(product -> shopRepository.findById(product.getShopId()))
                        .map(shop -> shop.getOwnerId().equals(user.getId())))
                .orElse(false);
    }

    public boolean isServiceOwner(Authentication authentication, ObjectId serviceId) {
        return getAuthenticatedUser(authentication)
                .flatMap(user -> serviceRepository.findById(serviceId)
                        .flatMap(serviceEntity -> shopRepository.findById(serviceEntity.getShopId()))
                        .map(shop -> shop.getOwnerId().equals(user.getId())))
                .orElse(false);
    }
}
