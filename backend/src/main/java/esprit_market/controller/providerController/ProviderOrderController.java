package esprit_market.controller.providerController;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.dto.cartDto.OrderResponse;
import esprit_market.dto.cartDto.ProviderOrderDTO;
import esprit_market.entity.cart.Order;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import esprit_market.service.cartService.IOrderService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Provider Order Controller
 * 
 * Allows providers (sellers) to:
 * - Update order status (PENDING → CONFIRMED/DECLINED)
 * - View order analytics
 * 
 * Providers can ONLY manage orders containing their products.
 */
@RestController
@RequestMapping("/api/provider/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROVIDER')")
public class ProviderOrderController {
    
    private final IOrderService orderService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    
    private User getAuthenticatedProvider(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
    }
    
    /**
     * Update order status (provider can confirm or decline orders)
     */
    @PutMapping("/{orderId}/status")
    public ResponseEntity<ProviderOrderDTO> updateOrderStatus(
            @PathVariable String orderId,
            @RequestParam String status,
            Authentication authentication) {
        
        try {
            User provider = getAuthenticatedProvider(authentication);
            System.out.println("🔍 UPDATE: Provider " + provider.getId() + " updating order " + orderId + " to " + status);
            
            // Get provider's shop
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(provider.getId());
            if (!shopOpt.isPresent()) {
                throw new RuntimeException("Provider shop not found");
            }
            Shop shop = shopOpt.get();
            
            // Validate provider can only set specific statuses
            OrderStatus newStatus = OrderStatus.valueOf(status.toUpperCase());
            
            // Providers can only set: CONFIRMED, DECLINED
            if (newStatus != OrderStatus.CONFIRMED && 
                newStatus != OrderStatus.DECLINED) {
                throw new IllegalArgumentException(
                    "Providers can only update status to CONFIRMED or DECLINED"
                );
            }
            
            // Get the order
            Optional<Order> orderOpt = orderRepository.findById(new ObjectId(orderId));
            if (!orderOpt.isPresent()) {
                throw new RuntimeException("Order not found");
            }
            Order order = orderOpt.get();
            
            // Verify this order contains provider's products
            List<OrderItem> providerItems = orderItemRepository.findByShopId(shop.getId())
                    .stream()
                    .filter(item -> item.getOrderId().equals(order.getId()))
                    .toList();

            // Fallback for legacy OrderItems without shopId
            if (providerItems.isEmpty()) {
                List<ObjectId> productIds = productRepository.findByShopId(shop.getId())
                        .stream().map(Product::getId).toList();
                if (!productIds.isEmpty()) {
                    providerItems = orderItemRepository.findByProductIdIn(productIds)
                            .stream()
                            .filter(item -> item.getOrderId().equals(order.getId()))
                            .toList();
                }
            }
            
            if (providerItems.isEmpty()) {
                throw new RuntimeException("This order does not contain your products");
            }
            
            // Update order status using the service
            OrderResponse updated = orderService.updateOrderStatus(order.getId(), status);
            
            // Return the first provider item as DTO (for compatibility)
            OrderItem firstItem = providerItems.get(0);
            ProviderOrderDTO dto = new ProviderOrderDTO();
            dto.setOrderId(order.getId().toHexString());
            dto.setCartItemId(firstItem.getId().toHexString());
            dto.setOrderStatus(newStatus.toString());
            
            System.out.println("✅ UPDATE: Order status updated successfully");
            return ResponseEntity.ok(dto);
            
        } catch (Exception e) {
            System.err.println("❌ UPDATE ERROR: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update order status: " + e.getMessage());
        }
    }
    
    /**
     * Get provider order analytics
     */
    @GetMapping("/analytics")
    public ResponseEntity<ProviderOrderAnalytics> getAnalytics(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            
            // Get provider's shop
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(provider.getId());
            if (!shopOpt.isPresent()) {
                return ResponseEntity.ok(ProviderOrderAnalytics.builder()
                        .totalOrders(0L)
                        .pendingOrders(0L)
                        .confirmedOrders(0L)
                        .declinedOrders(0L)
                        .totalRevenue(0.0)
                        .build());
            }
            
            Shop shop = shopOpt.get();
            
            // Get provider's order items
            List<OrderItem> providerOrderItems = orderItemRepository.findByShopId(shop.getId());
            if (providerOrderItems.isEmpty()) {
                List<ObjectId> productIds = productRepository.findByShopId(shop.getId())
                        .stream().map(Product::getId).toList();
                if (!productIds.isEmpty()) {
                    providerOrderItems = orderItemRepository.findByProductIdIn(productIds);
                }
            }
            
            // Group by order and calculate analytics
            long totalOrders = providerOrderItems.stream()
                    .map(OrderItem::getOrderId)
                    .distinct()
                    .count();
            
            // TODO: Implement detailed analytics
            ProviderOrderAnalytics analytics = ProviderOrderAnalytics.builder()
                    .totalOrders(totalOrders)
                    .pendingOrders(0L)
                    .confirmedOrders(0L)
                    .declinedOrders(0L)
                    .totalRevenue(0.0)
                    .build();
            
            return ResponseEntity.ok(analytics);
            
        } catch (Exception e) {
            System.err.println("❌ ANALYTICS ERROR: " + e.getMessage());
            return ResponseEntity.ok(ProviderOrderAnalytics.builder()
                    .totalOrders(0L)
                    .pendingOrders(0L)
                    .confirmedOrders(0L)
                    .declinedOrders(0L)
                    .totalRevenue(0.0)
                    .build());
        }
    }
    
    // DTO for analytics
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProviderOrderAnalytics {
        private Long totalOrders;
        private Long pendingOrders;
        private Long confirmedOrders;
        private Long declinedOrders;
        private Double totalRevenue;
    }
}
