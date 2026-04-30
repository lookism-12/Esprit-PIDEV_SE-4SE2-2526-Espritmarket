package esprit_market.controller.providerController;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.dto.cartDto.OrderResponse;
import esprit_market.dto.cartDto.ProviderOrderDTO;
import esprit_market.entity.cart.Order;
import esprit_market.entity.cart.OrderItem;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.SAV.Delivery;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.OrderItemRepository;
import esprit_market.repository.cartRepository.OrderRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.SAVRepository.DeliveryRepository;
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
import java.util.stream.Collectors;

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
    private final DeliveryRepository deliveryRepository;
    
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
            
            // Providers can only set: CONFIRMED, CANCELLED
            if (newStatus != OrderStatus.CONFIRMED && 
                newStatus != OrderStatus.CANCELLED) {
                throw new IllegalArgumentException(
                    "Providers can only update status to CONFIRMED or CANCELLED"
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
            
            // Update order status using the service with PROVIDER actor
            OrderResponse updated = orderService.updateOrderStatus(
                order.getId(), status, "PROVIDER"
            );
            
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
     * Get returned orders waiting for provider verification and restocking
     * 
     * IMPORTANT: This endpoint filters by Delivery.status = RETURNED
     * (not Order.status = RETURNED)
     * 
     * Returns orders whose deliveries have status=RETURNED
     * Falls back to cartId lookup when orderId is null (legacy deliveries)
     */
    @GetMapping("/returned")
    public ResponseEntity<List<OrderResponse>> getReturnedOrders(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            System.out.println("🔍 GET RETURNED ORDERS: Provider " + provider.getId());
            
            // Get provider's shop
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(provider.getId());
            if (!shopOpt.isPresent()) {
                System.out.println("⚠️ Provider shop not found");
                return ResponseEntity.ok(List.of());
            }
            Shop shop = shopOpt.get();
            System.out.println("✅ Provider shop found: " + shop.getId());
            
            // Step 1: Get all deliveries with status = RETURNED
            List<Delivery> returnedDeliveries = deliveryRepository.findByStatus("RETURNED");
            System.out.println("📦 Found " + returnedDeliveries.size() + " deliveries with status RETURNED");
            
            if (returnedDeliveries.isEmpty()) {
                System.out.println("⚠️ No deliveries with status RETURNED found");
                return ResponseEntity.ok(List.of());
            }
            
            // Step 2: Resolve Order for each delivery (orderId first, then cartId fallback)
            List<Order> returnedOrders = returnedDeliveries.stream()
                    .map(delivery -> {
                        // Try orderId first (new deliveries)
                        if (delivery.getOrderId() != null) {
                            Optional<Order> order = orderRepository.findById(delivery.getOrderId());
                            if (order.isPresent()) {
                                System.out.println("✅ Found order via orderId for delivery " + delivery.getId().toHexString());
                                return order.get();
                            }
                        }
                        // Fallback: find order via cartId (legacy deliveries)
                        if (delivery.getCartId() != null) {
                            Optional<Order> order = orderRepository.findAllByCartId(delivery.getCartId()).stream().findFirst();
                            if (order.isPresent()) {
                                System.out.println("✅ Found order via cartId for delivery " + delivery.getId().toHexString());
                                return order.get();
                            }
                        }
                        System.out.println("⚠️ No order found for delivery " + delivery.getId().toHexString()
                                + " (orderId=" + delivery.getOrderId() + ", cartId=" + delivery.getCartId() + ")");
                        return null;
                    })
                    .filter(order -> order != null)
                    .filter(order -> order.getStatus() != OrderStatus.RESTOCKED
                            && order.getStatus() != OrderStatus.DELIVERED
                            && order.getStatus() != OrderStatus.CANCELLED)
                    .distinct()
                    .collect(Collectors.toList());
            
            System.out.println("📋 Resolved " + returnedOrders.size() + " orders from " + returnedDeliveries.size() + " returned deliveries");
            
            // Step 3: Filter orders that contain provider's products
            List<OrderResponse> providerReturnedOrders = returnedOrders.stream()
                    .filter(order -> {
                        // Check if order contains provider's products
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
                        
                        boolean hasProviderProducts = !providerItems.isEmpty();
                        if (hasProviderProducts) {
                            System.out.println("✅ Order " + order.getId() + " contains provider's products");
                        }
                        return hasProviderProducts;
                    })
                    .map(order -> orderService.getOrderByIdAdmin(order.getId()))
                    .collect(Collectors.toList());
            
            System.out.println("✅ Returning " + providerReturnedOrders.size() + " returned orders for provider");
            return ResponseEntity.ok(providerReturnedOrders);
            
        } catch (Exception e) {
            System.err.println("❌ GET RETURNED ORDERS ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }
    
    /**
     * Provider confirms physical verification and restocking of returned order
     * POST /api/provider/orders/{orderId}/pickup
     * Changes order status from RETURNED to RESTOCKED and restores stock
     */
    @PostMapping("/{orderId}/pickup")
    public ResponseEntity<OrderResponse> confirmPickup(
            @PathVariable String orderId,
            Authentication authentication) {
        
        try {
            User provider = getAuthenticatedProvider(authentication);
            System.out.println("🔍 RESTOCK: Provider " + provider.getId() + " restocking order " + orderId);
            
            // Get provider's shop
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(provider.getId());
            if (!shopOpt.isPresent()) {
                throw new RuntimeException("Provider shop not found");
            }
            Shop shop = shopOpt.get();
            
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
            
            // Call service to restock (validates status and restores stock)
            OrderResponse updated = orderService.confirmPickup(order.getId());
            
            System.out.println("✅ RESTOCK: Provider restocked order, stock restored");
            return ResponseEntity.ok(updated);
            
        } catch (IllegalStateException e) {
            System.err.println("❌ RESTOCK VALIDATION ERROR: " + e.getMessage());
            throw new RuntimeException(e.getMessage());
        } catch (Exception e) {
            System.err.println("❌ RESTOCK ERROR: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to restock order: " + e.getMessage());
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
                        .cancelledOrders(0L)
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
                    .cancelledOrders(0L)
                    .totalRevenue(0.0)
                    .build();
            
            return ResponseEntity.ok(analytics);
            
        } catch (Exception e) {
            System.err.println("❌ ANALYTICS ERROR: " + e.getMessage());
            return ResponseEntity.ok(ProviderOrderAnalytics.builder()
                    .totalOrders(0L)
                    .pendingOrders(0L)
                    .confirmedOrders(0L)
                    .cancelledOrders(0L)
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
        private Long cancelledOrders;
        private Double totalRevenue;
    }
}
