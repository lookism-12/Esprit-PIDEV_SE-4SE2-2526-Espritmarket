package esprit_market.mappers.cartMapper;

import esprit_market.Enum.cartEnum.CartItemStatus;
import esprit_market.dto.cartDto.CartItemResponse;
import esprit_market.entity.cart.CartItem;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CartItemMapper {
    
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    
    /**
     * Convert entity to Response DTO with computed fields and enriched product data.
     */
    public CartItemResponse toResponse(CartItem item) {
        if (item == null) return null;
        
        int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
        int cancelledQty = item.getCancelledQuantity() != null ? item.getCancelledQuantity() : 0;
        int availableQuantity = quantity - cancelledQty;
        
        boolean isPartiallyRefunded = cancelledQty > 0 && cancelledQty < quantity;
        boolean isFullyRefunded = cancelledQty >= quantity;
        
        // ✅ ENRICH WITH PRODUCT DATA
        String imageUrl = "/images/default-product.jpg";
        String category = "General";
        String sellerName = "Unknown Seller";
        Integer stock = 0;
        String stockStatus = "UNKNOWN";
        
        if (item.getProductId() != null) {
            Product product = productRepository.findById(item.getProductId()).orElse(null);
            if (product != null) {
                // Get product image
                if (product.getImages() != null && !product.getImages().isEmpty()) {
                    imageUrl = product.getImages().get(0).getUrl();
                }
                
                // Get stock info
                Integer productStock = product.getStock();
                stock = (productStock != null) ? productStock : 0;
                if (stock <= 0) {
                    stockStatus = "OUT_OF_STOCK";
                } else if (stock <= 5) {
                    stockStatus = "LOW_STOCK";
                } else {
                    stockStatus = "IN_STOCK";
                }
                
                // Get category name
                if (product.getCategoryIds() != null && !product.getCategoryIds().isEmpty()) {
                    Category cat = categoryRepository.findById(product.getCategoryIds().get(0)).orElse(null);
                    if (cat != null) {
                        category = cat.getName();
                    }
                }
                
                // Get seller name via Shop (priority: shop name > business name > owner name)
                if (product.getShopId() != null) {
                    Shop shop = shopRepository.findById(product.getShopId()).orElse(null);
                    if (shop != null) {
                        // ✅ PRIORITY 1: Use shop name if available
                        if (shop.getName() != null && !shop.getName().isEmpty()) {
                            sellerName = shop.getName();
                        } 
                        // ✅ PRIORITY 2: Fallback to business name or owner name
                        else if (shop.getOwnerId() != null) {
                            User owner = userRepository.findById(shop.getOwnerId()).orElse(null);
                            if (owner != null) {
                                // Try business name first (for providers)
                                if (owner.getBusinessName() != null && !owner.getBusinessName().isEmpty()) {
                                    sellerName = owner.getBusinessName();
                                } else {
                                    // Fallback to full name
                                    sellerName = owner.getFirstName() + " " + owner.getLastName();
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return CartItemResponse.builder()
            .id(item.getId() != null ? item.getId().toHexString() : null)
            .cartId(item.getCartId() != null ? item.getCartId().toHexString() : null)
            .productId(item.getProductId() != null ? item.getProductId().toHexString() : null)
            .productName(item.getProductName())
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .subTotal(item.getSubTotal())
            .discountApplied(item.getDiscountApplied())
            .status(item.getStatus() != null ? item.getStatus() : CartItemStatus.ACTIVE)
            .cancelledQuantity(item.getCancelledQuantity())
            .refundAmount(item.getRefundAmount())
            .cancellationReason(item.getCancellationReason())
            .availableQuantity(availableQuantity)
            .isPartiallyRefunded(isPartiallyRefunded)
            .isFullyRefunded(isFullyRefunded)
            // ✅ ENRICHED FIELDS
            .imageUrl(imageUrl)
            .category(category)
            .sellerName(sellerName)
            .stock(stock)
            .stockStatus(stockStatus)
            .build();
    }
}
