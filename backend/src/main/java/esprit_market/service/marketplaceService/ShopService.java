package esprit_market.service.marketplaceService;

import esprit_market.dto.marketplace.ShopRequestDTO;
import esprit_market.dto.marketplace.ShopResponseDTO;
import esprit_market.entity.marketplace.Shop;
import esprit_market.config.Exceptions.ResourceNotFoundException;
import esprit_market.mappers.marketplace.ShopMapper;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import esprit_market.entity.user.User;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService implements IShopService {
    private static final Logger log = LoggerFactory.getLogger(ShopService.class);
    
    private final ShopRepository repository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ShopMapper mapper;

    @Override
    public List<ShopResponseDTO> findAll() {
        log.info("findAll() - Loading all shops");
        List<Shop> shops = repository.findAll();
        log.info("findAll() - Found {} shops", shops.size());
        
        return shops.stream()
                .map(this::enrichShopDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ShopResponseDTO findById(ObjectId id) {
        Shop shop = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));
        return enrichShopDTO(shop);
    }

    @Override
    public ShopResponseDTO findMyShop() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new ResourceNotFoundException("Not authenticated");
        }
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Shop shop = repository.findByOwnerId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No shop found for this account"));
        return enrichShopDTO(shop);
    }
    
    /**
     * Enrich shop DTO with owner name, email, and comprehensive statistics
     */
    private ShopResponseDTO enrichShopDTO(Shop shop) {
        ShopResponseDTO dto = mapper.toDTO(shop);
        
        // Add owner name and email
        if (shop.getOwnerId() != null) {
            userRepository.findById(shop.getOwnerId()).ifPresent(user -> {
                dto.setOwnerName(user.getFirstName() + " " + user.getLastName());
                dto.setOwnerEmail(user.getEmail());
                
                // ✅ Add trust score and badge
                dto.setTrustScore(user.getTrustScore());
                dto.setTrustBadge(shop.getTrustBadge());
            });
        }
        
        // Calculate comprehensive product statistics
        List<esprit_market.entity.marketplace.Product> products = productRepository.findByShopId(shop.getId());
        dto.setProductCount(products.size());
        
        // Count approved products
        long approvedCount = products.stream()
                .filter(p -> p.getStatus() == esprit_market.Enum.marketplaceEnum.ProductStatus.APPROVED)
                .count();
        dto.setApprovedProductCount((int) approvedCount);
        
        // TODO: Calculate average rating and reviews from future review system
        dto.setAverageRating(0.0);
        dto.setTotalReviews(0);
        
        return dto;
    }

    @Override
    public ShopResponseDTO create(ShopRequestDTO dto) {
        // Validate Owner (User) existence
        if (dto.getOwnerId() != null) {
            ObjectId ownerId = new ObjectId(dto.getOwnerId());
            userRepository.findById(ownerId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("User (owner) not found with id: " + dto.getOwnerId()));
        }
        Shop shop = mapper.toEntity(dto);
        Shop saved = repository.save(shop);
        return enrichShopDTO(saved);
    }

    @Override
    public ShopResponseDTO update(ObjectId id, ShopRequestDTO dto) {
        Shop existingShop = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop not found with id: " + id));

        // Update basic fields
        if (dto.getName() != null) {
            existingShop.setName(dto.getName());
        }
        if (dto.getDescription() != null) {
            existingShop.setDescription(dto.getDescription());
        }
        if (dto.getAddress() != null) {
            existingShop.setAddress(dto.getAddress());
        }
        if (dto.getPhone() != null) {
            existingShop.setPhone(dto.getPhone());
        }
        if (dto.getEmail() != null) {
            existingShop.setEmail(dto.getEmail());
        }
        if (dto.getLogo() != null) {
            existingShop.setLogo(dto.getLogo());
        }
        
        // Update social links
        if (dto.getSocialLinks() != null) {
            existingShop.setSocialLinks(dto.getSocialLinks());
        }
        
        // Update active status
        if (dto.getIsActive() != null) {
            existingShop.setActive(dto.getIsActive());
        }
        
        // Update timestamp
        existingShop.setUpdatedAt(java.time.LocalDateTime.now());

        // Validate and update owner if changed
        if (dto.getOwnerId() != null) {
            ObjectId ownerId = new ObjectId(dto.getOwnerId());
            userRepository.findById(ownerId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("User (owner) not found with id: " + dto.getOwnerId()));
            existingShop.setOwnerId(ownerId);
        }

        Shop saved = repository.save(existingShop);
        return enrichShopDTO(saved);
    }

    @Override
    public void deleteById(ObjectId id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Shop not found with id: " + id);
        }
        repository.deleteById(id);
    }
}
