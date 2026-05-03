package esprit_market.controller.adminController;

import esprit_market.dto.marketplace.ProductResponseDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.mappers.marketplace.ShopMapper;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.marketplaceService.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin management APIs")
public class AdminController {
    
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final ShopMapper shopMapper;
    private final MongoTemplate mongoTemplate;

    /**
     * Get all providers (users with shops) for admin dashboard
     */
    @GetMapping("/providers")
    @Operation(summary = "Get all providers with their shops (ADMIN only)")
    public List<ProviderWithShopDTO> getAllProviders() {
        List<Shop> shops = shopRepository.findAll();
        
        return shops.stream().map(shop -> {
            User owner = userRepository.findById(shop.getOwnerId()).orElse(null);
            if (owner == null) return null;
            
            // Get products count for this shop
            List<ProductResponseDTO> products = productService.findByShopId(shop.getId());
            
            return ProviderWithShopDTO.builder()
                .providerId(owner.getId().toHexString())
                .providerName(owner.getFirstName() + " " + owner.getLastName())
                .providerEmail(owner.getEmail())
                .shopId(shop.getId().toHexString())
                .productCount(products.size())
                .build();
        }).filter(dto -> dto != null).collect(Collectors.toList());
    }

    /**
     * Get all products by a specific provider for coupon creation
     */
    @GetMapping("/providers/{providerId}/products")
    @Operation(summary = "Get all products by provider (ADMIN only)")
    public List<ProductResponseDTO> getProductsByProvider(@PathVariable String providerId) {
        ObjectId providerObjectId = new ObjectId(providerId);
        
        // Find provider's shop
        Shop shop = shopRepository.findByOwnerId(providerObjectId)
                .orElseThrow(() -> new RuntimeException("Provider shop not found"));
        
        // Get all products for this shop
        return productService.findByShopId(shop.getId());
    }

    /**
     * Get all products from all providers (for admin overview)
     */
    @GetMapping("/products")
    @Operation(summary = "Get all products from all providers (ADMIN only)")
    public List<ProductResponseDTO> getAllProducts() {
        return productService.findAll();
    }

    /**
     * Get MongoDB statistics (collection names and document counts)
     */
    @GetMapping("/mongodb/stats")
    @Operation(summary = "Get MongoDB database statistics (ADMIN only)")
    public Map<String, Long> getMongoStats() {
        Map<String, Long> stats = new HashMap<>();
        for (String collectionName : mongoTemplate.getCollectionNames()) {
            try {
                stats.put(collectionName, mongoTemplate.getCollection(collectionName).countDocuments());
            } catch (Exception e) {
                stats.put(collectionName, -1L);
            }
        }
        return stats;
    }

    @GetMapping("/mongodb/export")
    @Operation(summary = "Export all project data as JSON (ADMIN only)")
    public Map<String, Object> exportAllData() {
        Map<String, Object> backup = new HashMap<>();
        
        // Dynamically get all collection names to ensure 100% data recovery
        for (String collectionName : mongoTemplate.getCollectionNames()) {
            try {
                backup.put(collectionName, mongoTemplate.findAll(Object.class, collectionName));
            } catch (Exception e) {
                backup.put(collectionName, "Error: " + e.getMessage());
            }
        }
        return backup;
    }

    /**
     * Get raw data from a specific collection (for Admin Inspector)
     */
    @GetMapping("/mongodb/collection/{collectionName}")
    @Operation(summary = "Get raw data from a specific collection (ADMIN only)")
    public List<Object> getCollectionData(@PathVariable String collectionName) {
        return mongoTemplate.findAll(Object.class, collectionName);
    }

    /**
     * DTO for provider with shop information
     */
    public static class ProviderWithShopDTO {
        private String providerId;
        private String providerName;
        private String providerEmail;
        private String shopId;
        private int productCount;

        public static ProviderWithShopDTOBuilder builder() {
            return new ProviderWithShopDTOBuilder();
        }

        // Getters and setters
        public String getProviderId() { return providerId; }
        public void setProviderId(String providerId) { this.providerId = providerId; }
        
        public String getProviderName() { return providerName; }
        public void setProviderName(String providerName) { this.providerName = providerName; }
        
        public String getProviderEmail() { return providerEmail; }
        public void setProviderEmail(String providerEmail) { this.providerEmail = providerEmail; }
        
        public String getShopId() { return shopId; }
        public void setShopId(String shopId) { this.shopId = shopId; }
        
        public int getProductCount() { return productCount; }
        public void setProductCount(int productCount) { this.productCount = productCount; }

        public static class ProviderWithShopDTOBuilder {
            private String providerId;
            private String providerName;
            private String providerEmail;
            private String shopId;
            private int productCount;

            public ProviderWithShopDTOBuilder providerId(String providerId) {
                this.providerId = providerId;
                return this;
            }

            public ProviderWithShopDTOBuilder providerName(String providerName) {
                this.providerName = providerName;
                return this;
            }

            public ProviderWithShopDTOBuilder providerEmail(String providerEmail) {
                this.providerEmail = providerEmail;
                return this;
            }

            public ProviderWithShopDTOBuilder shopId(String shopId) {
                this.shopId = shopId;
                return this;
            }

            public ProviderWithShopDTOBuilder productCount(int productCount) {
                this.productCount = productCount;
                return this;
            }

            public ProviderWithShopDTO build() {
                ProviderWithShopDTO dto = new ProviderWithShopDTO();
                dto.setProviderId(this.providerId);
                dto.setProviderName(this.providerName);
                dto.setProviderEmail(this.providerEmail);
                dto.setShopId(this.shopId);
                dto.setProductCount(this.productCount);
                return dto;
            }
        }
    }
}