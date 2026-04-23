package esprit_market.mappers.marketplace;

import esprit_market.dto.marketplace.ProductImageDTO;
import esprit_market.dto.marketplace.ProductRequestDTO;
import esprit_market.dto.marketplace.ProductResponseDTO;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ProductImage;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.Enum.marketplaceEnum.ProductStatus;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public ProductResponseDTO toDTO(Product product) {
        if (product == null)
            return null;

        List<String> categoryIds = product.getCategoryIds() != null
                ? product.getCategoryIds().stream().map(ObjectId::toHexString).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductImageDTO> images = product.getImages() != null
                ? product.getImages().stream()
                        .map(img -> new ProductImageDTO(img.getUrl(), img.getAltText()))
                        .collect(Collectors.toList())
                : new ArrayList<>();

        // ✅ ENRICH: Resolve seller name and shop info from Shop → User
        String sellerName = "Unknown Seller";
        String shopName = "Unknown Shop";
        String shopLogo = null;
        Double trustScore = null;
        String trustBadge = null;
        
        if (product.getShopId() != null) {
            Shop shop = shopRepository.findById(product.getShopId()).orElse(null);
            if (shop != null) {
                // Set shop name and logo
                shopName = shop.getName() != null ? shop.getName() : "Unknown Shop";
                shopLogo = shop.getLogo();
                
                // ✅ Get trust info from shop
                trustScore = shop.getTrustScore();
                trustBadge = shop.getTrustBadge();
                
                // Get seller name from shop owner
                if (shop.getOwnerId() != null) {
                    User owner = userRepository.findById(shop.getOwnerId()).orElse(null);
                    if (owner != null) {
                        sellerName = (owner.getFirstName() != null ? owner.getFirstName() : "") + 
                                     " " + 
                                     (owner.getLastName() != null ? owner.getLastName() : "");
                        sellerName = sellerName.trim();
                        if (sellerName.isEmpty()) {
                            sellerName = "Unknown Seller";
                        }
                    }
                }
            }
        }

        // ✅ ENRICH: Resolve first category name
        String categoryName = "Autres";
        if (product.getCategoryIds() != null && !product.getCategoryIds().isEmpty()) {
            ObjectId firstCategoryId = product.getCategoryIds().get(0);
            Category category = categoryRepository.findById(firstCategoryId).orElse(null);
            if (category != null && category.getName() != null) {
                categoryName = category.getName();
            }
        }

        // ✅ ENRICH: Calculate stock status
        String stockStatus;
        boolean isAvailable;
        int stock = product.getStock();
        
        if (stock > 10) {
            stockStatus = "IN_STOCK";
            isAvailable = true;
        } else if (stock > 0) {
            stockStatus = "LOW_STOCK";
            isAvailable = true;
        } else {
            stockStatus = "OUT_OF_STOCK";
            isAvailable = false;
        }

        // ✅ ENRICH: Resolve approver name
        String approvedBy = null;
        if (product.getApprovedBy() != null) {
            User approver = userRepository.findById(product.getApprovedBy()).orElse(null);
            if (approver != null) {
                approvedBy = (approver.getFirstName() != null ? approver.getFirstName() : "") + 
                            " " + 
                            (approver.getLastName() != null ? approver.getLastName() : "");
                approvedBy = approvedBy.trim();
                if (approvedBy.isEmpty()) {
                    approvedBy = "Admin";
                }
            }
        }

        return ProductResponseDTO.builder()
                .id(product.getId() != null ? product.getId().toHexString() : null)
                .name(product.getName())
                .description(product.getDescription())
                .shopId(product.getShopId() != null ? product.getShopId().toHexString() : null)
                .shopName(shopName)
                .shopLogo(shopLogo)
                .categoryIds(categoryIds)
                .price(product.getPrice())
                .stock(product.getStock())
                .images(images)
                .sellerName(sellerName)
                .stockStatus(stockStatus)
                .isAvailable(isAvailable)
                // ✅ APPROVAL WORKFLOW FIELDS
                .status(product.getStatus() != null ? product.getStatus() : ProductStatus.PENDING)
                .createdAt(product.getCreatedAt())
                .approvedAt(product.getApprovedAt())
                .approvedBy(approvedBy)
                .rejectionReason(product.getRejectionReason())
                // ✅ TRUST & REPUTATION FIELDS
                .trustScore(trustScore)
                .trustBadge(trustBadge)
                .build();
    }

    public Product toEntity(ProductRequestDTO dto) {
        if (dto == null)
            return null;

        List<ObjectId> categoryIds = dto.getCategoryIds() != null
                ? dto.getCategoryIds().stream().map(ObjectId::new).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductImage> images = dto.getImages() != null
                ? dto.getImages().stream()
                        .map(imgDto -> new ProductImage(imgDto.getUrl(), imgDto.getAltText()))
                        .collect(Collectors.toList())
                : new ArrayList<>();

        return Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .shopId(dto.getShopId() != null ? new ObjectId(dto.getShopId()) : null)
                .categoryIds(categoryIds)
                .price(dto.getPrice())
                .stock(dto.getStock())
                .images(images)
                // ✅ NEW PRODUCTS START AS PENDING
                .status(ProductStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
