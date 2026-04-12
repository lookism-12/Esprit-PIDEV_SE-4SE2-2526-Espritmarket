package esprit_market.controller.providerController;

import esprit_market.Enum.cartEnum.OrderStatus;
import esprit_market.dto.cartDto.CartResponse;
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
import esprit_market.service.cartService.ICartService;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Provider Dashboard Controller (Order-based)
 * 
 * This controller handles provider dashboard statistics and order viewing.
 * Base path: /api/provider/dashboard
 * 
 * For order status updates, see ProviderOrderController.
 * 
 * Responsibilities:
 * - View orders from Order collection (ProviderOrderDTO)
 * - View dashboard statistics (read-only)
 * - Debug endpoints
 * 
 * IMPORTANT: This controller is READ-ONLY for statistics.
 * Order status updates are handled by ProviderOrderController.
 */
@RestController
@RequestMapping("/api/provider/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROVIDER')")
public class ProviderDashboardController {

    private final ICartService cartService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;

    /**
     * DEBUG: Check provider data and orders (from Order collection)
     */
    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugProviderData(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            Map<String, Object> debug = new HashMap<>();
            
            debug.put("providerId", provider.getId().toHexString());
            debug.put("providerEmail", provider.getEmail());
            
            // Check shop
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(provider.getId());
            if (shopOpt.isPresent()) {
                Shop shop = shopOpt.get();
                debug.put("shopId", shop.getId().toHexString());
                debug.put("shopName", shop.getName());
                
                // Check products
                List<Product> products = productRepository.findByShopId(shop.getId());
                debug.put("productCount", products.size());
                List<Map<String, Object>> productDetails = new ArrayList<>();
                for (Product product : products) {
                    Map<String, Object> productMap = new HashMap<>();
                    productMap.put("id", product.getId().toHexString());
                    productMap.put("name", product.getName());
                    productMap.put("status", product.getStatus().toString());
                    productDetails.add(productMap);
                }
                debug.put("products", productDetails);
            } else {
                debug.put("shopId", "NOT FOUND");
            }
            
            // Check all orders (from Order collection)
            List<Order> allOrders = orderRepository.findAll();
            debug.put("totalOrdersInSystem", allOrders.size());
            
            // Check all order items
            List<OrderItem> allOrderItems = orderItemRepository.findAll();
            debug.put("totalOrderItemsInSystem", allOrderItems.size());
            
            // Check each order's items
            List<Map<String, Object>> orderDetails = new ArrayList<>();
            for (Order order : allOrders) {
                Map<String, Object> orderMap = new HashMap<>();
                orderMap.put("orderId", order.getId().toHexString());
                orderMap.put("orderNumber", order.getOrderNumber());
                orderMap.put("status", order.getStatus().toString());
                orderMap.put("userId", order.getUser() != null ? order.getUser().getId().toHexString() : "NULL");
                orderMap.put("totalAmount", order.getTotalAmount());
                orderMap.put("finalAmount", order.getFinalAmount());
                
                List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
                orderMap.put("itemCount", items.size());
                
                List<Map<String, Object>> itemDetails = new ArrayList<>();
                for (OrderItem item : items) {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("orderItemId", item.getId() != null ? item.getId().toHexString() : "NULL");
                    itemMap.put("productId", item.getProductId() != null ? item.getProductId().toHexString() : "NULL");
                    itemMap.put("productName", item.getProductName());
                    itemMap.put("quantity", item.getQuantity());
                    itemMap.put("productPrice", item.getProductPrice());
                    itemMap.put("subtotal", item.getSubtotal());
                    itemMap.put("status", item.getStatus().toString());
                    itemDetails.add(itemMap);
                }
                orderMap.put("items", itemDetails);
                
                orderDetails.add(orderMap);
            }
            debug.put("orders", orderDetails);
            
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("stackTrace", Arrays.toString(e.getStackTrace()));
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Get all orders for the current provider's products (from Order collection)
     * Returns orders with status: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, etc.
     */
    @GetMapping("/orders")
    public ResponseEntity<List<ProviderOrderDTO>> getProviderOrders(Authentication authentication) {
        try {
            // Get logged-in provider
            User provider = getAuthenticatedProvider(authentication);
            System.out.println("🔍 DEBUG: Provider ID: " + provider.getId());

            // Get provider's shop
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(provider.getId());
            if (!shopOpt.isPresent()) {
                System.out.println("⚠️ WARNING: No shop found for provider " + provider.getId());
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            Shop shop = shopOpt.get();
            System.out.println("🔍 DEBUG: Shop ID: " + shop.getId());

            // ✅ OPTIMIZED: Use shopId directly from OrderItems instead of fetching all products
            List<OrderItem> providerOrderItems = orderItemRepository.findByShopId(shop.getId());
            System.out.println("🔍 DEBUG: Provider order items count: " + providerOrderItems.size());
            
            if (providerOrderItems.isEmpty()) {
                System.out.println("⚠️ WARNING: No order items found for shop " + shop.getId());
                return ResponseEntity.ok(new ArrayList<>());
            }

            // Group order items by orderId for efficient processing
            Map<ObjectId, List<OrderItem>> itemsByOrder = providerOrderItems.stream()
                    .collect(Collectors.groupingBy(OrderItem::getOrderId));
            
            System.out.println("🔍 DEBUG: Orders containing provider products: " + itemsByOrder.size());

            List<ProviderOrderDTO> providerOrders = new ArrayList<>();

            // Process each order that contains provider's products
            for (Map.Entry<ObjectId, List<OrderItem>> entry : itemsByOrder.entrySet()) {
                ObjectId orderId = entry.getKey();
                List<OrderItem> orderItems = entry.getValue();
                
                // Get the order details
                Optional<Order> orderOpt = orderRepository.findById(orderId);
                if (!orderOpt.isPresent()) {
                    System.out.println("⚠️ WARNING: Order not found: " + orderId);
                    continue;
                }
                
                Order order = orderOpt.get();
                System.out.println("🔍 DEBUG: Processing order " + order.getOrderNumber() + " with " + orderItems.size() + " provider items");

                // Create DTO for each provider item in this order
                for (OrderItem item : orderItems) {
                    ProviderOrderDTO dto = new ProviderOrderDTO();
                    dto.setOrderId(order.getId().toHexString());
                    dto.setCartItemId(item.getId() != null ? item.getId().toHexString() : "unknown");
                    
                    // Get user info safely
                    String clientName = "Unknown Customer";
                    String clientEmail = "unknown@example.com";
                    if (order.getUser() != null) {
                        User customer = order.getUser();
                        clientName = (customer.getFirstName() != null ? customer.getFirstName() : "") + 
                                   " " + (customer.getLastName() != null ? customer.getLastName() : "");
                        clientName = clientName.trim();
                        if (clientName.isEmpty()) clientName = "Unknown Customer";
                        clientEmail = customer.getEmail() != null ? customer.getEmail() : "unknown@example.com";
                    }
                    
                    dto.setClientName(clientName);
                    dto.setClientEmail(clientEmail);
                    dto.setProductName(item.getProductName() != null ? item.getProductName() : "Unknown Product");
                    dto.setQuantity(item.getQuantity() != null ? item.getQuantity() : 0);
                    dto.setUnitPrice(item.getProductPrice() != null ? item.getProductPrice() : 0.0);
                    dto.setSubTotal(item.getSubtotal() != null ? item.getSubtotal() : 0.0);
                    dto.setOrderStatus(order.getStatus() != null ? order.getStatus().toString() : "UNKNOWN");
                    dto.setOrderDate(order.getCreatedAt());

                    providerOrders.add(dto);
                }
            }

            System.out.println("🔍 DEBUG: Final provider orders count: " + providerOrders.size());
            return ResponseEntity.ok(providerOrders);
        } catch (Exception e) {
            System.err.println("❌ Provider Orders Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    // ❌ REMOVED: Duplicate updateOrderStatus() method
    // This endpoint is now handled by ProviderOrderController
    // ProviderDashboardController should be READ-ONLY (statistics/analytics only)

    /**
     * Update individual product status within an order (DEPRECATED)
     * 
     * @deprecated This method is deprecated. Use ProviderOrderController for order status updates.
     * This endpoint will be removed in a future version.
     */
    @Deprecated
    @PutMapping("/orders/{orderId}/items/{cartItemId}/status")
    public ResponseEntity<ProviderOrderDTO> updateProductStatus(
            @PathVariable String orderId,
            @PathVariable String cartItemId,
            @RequestParam String newStatus,
            Authentication authentication) {
        System.err.println("⚠️ DEPRECATED: /api/provider/dashboard/orders/{orderId}/items/{cartItemId}/status is deprecated. Use ProviderOrderController instead.");
        return ResponseEntity.status(HttpStatus.GONE)
                .body(null);
    }

    /**
     * Get detailed order information (DEPRECATED)
     * 
     * @deprecated This method is deprecated. Use ProviderOrderController for order details.
     */
    @Deprecated
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<CartResponse> getOrderDetails(
            @PathVariable String orderId,
            Authentication authentication) {
        System.err.println("⚠️ DEPRECATED: /api/provider/dashboard/orders/{orderId} is deprecated. Use ProviderOrderController instead.");
        return ResponseEntity.status(HttpStatus.GONE).build();
    }

    /**
     * Get provider dashboard statistics (from Order collection)
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            System.out.println("🔍 STATS: Provider ID: " + provider.getId());

            // Get provider's shop
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(provider.getId());
            if (!shopOpt.isPresent()) {
                System.out.println("⚠️ WARNING: No shop found for provider " + provider.getId());
                // Return empty stats instead of error
                Map<String, Object> emptyStats = new HashMap<>();
                emptyStats.put("pendingOrders", 0);
                emptyStats.put("confirmedOrders", 0);
                emptyStats.put("paidOrders", 0);
                emptyStats.put("declinedOrders", 0);
                emptyStats.put("totalOrders", 0);
                emptyStats.put("totalRevenue", 0.0);
                emptyStats.put("message", "No shop found for provider");
                return ResponseEntity.ok(emptyStats);
            }
            
            Shop shop = shopOpt.get();
            System.out.println("🔍 STATS: Shop ID: " + shop.getId());

            // ✅ OPTIMIZED: Use shopId directly from OrderItems
            List<OrderItem> providerOrderItems = orderItemRepository.findByShopId(shop.getId());
            System.out.println("🔍 STATS: Provider order items count: " + providerOrderItems.size());
            
            if (providerOrderItems.isEmpty()) {
                System.out.println("⚠️ WARNING: No order items found for shop " + shop.getId());
                // Return empty stats instead of error
                Map<String, Object> emptyStats = new HashMap<>();
                emptyStats.put("pendingOrders", 0);
                emptyStats.put("confirmedOrders", 0);
                emptyStats.put("paidOrders", 0);
                emptyStats.put("declinedOrders", 0);
                emptyStats.put("totalOrders", 0);
                emptyStats.put("totalRevenue", 0.0);
                emptyStats.put("message", "No orders found for this shop");
                return ResponseEntity.ok(emptyStats);
            }

            // Group by orderId to get unique orders
            Map<ObjectId, List<OrderItem>> itemsByOrder = providerOrderItems.stream()
                    .collect(Collectors.groupingBy(OrderItem::getOrderId));

            Map<String, Integer> statusCounts = new HashMap<>();
            Double totalRevenue = 0.0;
            int providerOrderCount = itemsByOrder.size();

            // Process each unique order
            for (Map.Entry<ObjectId, List<OrderItem>> entry : itemsByOrder.entrySet()) {
                ObjectId orderId = entry.getKey();
                List<OrderItem> orderItems = entry.getValue();
                
                // Get the order details
                Optional<Order> orderOpt = orderRepository.findById(orderId);
                if (!orderOpt.isPresent()) {
                    System.out.println("⚠️ WARNING: Order not found: " + orderId);
                    continue;
                }
                
                Order order = orderOpt.get();
                
                // Count status (count each order only once)
                String status = order.getStatus().toString();
                statusCounts.put(status, statusCounts.getOrDefault(status, 0) + 1);

                // Calculate revenue for paid orders only (sum all provider items in this order)
                if (order.getStatus() == OrderStatus.PAID) {
                    for (OrderItem item : orderItems) {
                        if (item.getSubtotal() != null) {
                            totalRevenue += item.getSubtotal();
                        }
                    }
                }
            }

            System.out.println("🔍 STATS: Provider orders: " + providerOrderCount);
            System.out.println("🔍 STATS: Status counts: " + statusCounts);
            System.out.println("🔍 STATS: Total revenue: " + totalRevenue);

            Map<String, Object> stats = new HashMap<>();
            stats.put("pendingOrders", statusCounts.getOrDefault("PENDING", 0));
            stats.put("confirmedOrders", statusCounts.getOrDefault("CONFIRMED", 0));
            stats.put("paidOrders", statusCounts.getOrDefault("PAID", 0));
            stats.put("declinedOrders", statusCounts.getOrDefault("DECLINED", 0));
            stats.put("totalOrders", providerOrderCount);
            stats.put("totalRevenue", totalRevenue);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("❌ Statistics Error: " + e.getMessage());
            e.printStackTrace();
            
            // Return empty stats instead of 500 error
            Map<String, Object> emptyStats = new HashMap<>();
            emptyStats.put("pendingOrders", 0);
            emptyStats.put("confirmedOrders", 0);
            emptyStats.put("paidOrders", 0);
            emptyStats.put("declinedOrders", 0);
            emptyStats.put("totalOrders", 0);
            emptyStats.put("totalRevenue", 0.0);
            emptyStats.put("error", e.getMessage());
            
            return ResponseEntity.ok(emptyStats);
        }
    }

    // ==================== HELPER METHODS ====================

    private User getAuthenticatedProvider(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
    }
}
