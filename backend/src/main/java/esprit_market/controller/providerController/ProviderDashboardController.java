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
     * DEBUG: COMPREHENSIVE data relationship verification
     * This will PROVE exactly what's in the database and why the query fails
     */
    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugProviderData(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            Map<String, Object> debug = new HashMap<>();
            
            System.out.println("🔍 ===== COMPREHENSIVE DEBUG START =====");
            
            // 1. PROVIDER DATA
            debug.put("providerId", provider.getId().toHexString());
            debug.put("providerEmail", provider.getEmail());
            System.out.println("🔍 PROVIDER ID: " + provider.getId().toHexString());
            System.out.println("🔍 PROVIDER EMAIL: " + provider.getEmail());
            
            // 2. SHOP DATA
            Optional<Shop> shopOpt = shopRepository.findByOwnerId(provider.getId());
            if (shopOpt.isPresent()) {
                Shop shop = shopOpt.get();
                debug.put("shopId", shop.getId().toHexString());
                debug.put("shopName", shop.getName());
                System.out.println("🔍 SHOP ID: " + shop.getId().toHexString());
                System.out.println("🔍 SHOP NAME: " + shop.getName());
                
                // 3. PRODUCTS IN SHOP
                List<Product> products = productRepository.findByShopId(shop.getId());
                debug.put("productCount", products.size());
                System.out.println("🔍 PRODUCTS IN SHOP: " + products.size());
                
                List<Map<String, Object>> productDetails = new ArrayList<>();
                for (Product product : products) {
                    Map<String, Object> productMap = new HashMap<>();
                    productMap.put("id", product.getId().toHexString());
                    productMap.put("name", product.getName());
                    productMap.put("shopId", product.getShopId() != null ? product.getShopId().toHexString() : "NULL");
                    productMap.put("status", product.getStatus().toString());
                    productDetails.add(productMap);
                    System.out.println("🔍 PRODUCT: " + product.getName() + " | ID: " + product.getId().toHexString() + " | SHOP_ID: " + (product.getShopId() != null ? product.getShopId().toHexString() : "NULL"));
                }
                debug.put("products", productDetails);
                
                // 4. ALL ORDER ITEMS IN SYSTEM
                List<OrderItem> allOrderItems = orderItemRepository.findAll();
                debug.put("totalOrderItemsInSystem", allOrderItems.size());
                System.out.println("🔍 TOTAL ORDER ITEMS IN SYSTEM: " + allOrderItems.size());
                
                List<Map<String, Object>> orderItemDetails = new ArrayList<>();
                int itemsWithShopId = 0;
                int itemsWithoutShopId = 0;
                int itemsForThisShop = 0;
                
                for (OrderItem item : allOrderItems) {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("orderItemId", item.getId() != null ? item.getId().toHexString() : "NULL");
                    itemMap.put("orderId", item.getOrderId() != null ? item.getOrderId().toHexString() : "NULL");
                    itemMap.put("productId", item.getProductId() != null ? item.getProductId().toHexString() : "NULL");
                    itemMap.put("productName", item.getProductName());
                    itemMap.put("shopId", item.getShopId() != null ? item.getShopId().toHexString() : "NULL");
                    itemMap.put("quantity", item.getQuantity());
                    itemMap.put("subtotal", item.getSubtotal());
                    itemMap.put("status", item.getStatus().toString());
                    
                    // CRITICAL: Check if this item belongs to current provider's shop
                    boolean belongsToThisShop = item.getShopId() != null && item.getShopId().equals(shop.getId());
                    itemMap.put("belongsToCurrentProviderShop", belongsToThisShop);
                    
                    if (item.getShopId() != null) {
                        itemsWithShopId++;
                        if (belongsToThisShop) {
                            itemsForThisShop++;
                        }
                    } else {
                        itemsWithoutShopId++;
                    }
                    
                    orderItemDetails.add(itemMap);
                    
                    System.out.println("🔍 ORDER ITEM: " + item.getProductName() + 
                                     " | ORDER_ID: " + (item.getOrderId() != null ? item.getOrderId().toHexString() : "NULL") +
                                     " | PRODUCT_ID: " + (item.getProductId() != null ? item.getProductId().toHexString() : "NULL") +
                                     " | SHOP_ID: " + (item.getShopId() != null ? item.getShopId().toHexString() : "NULL") +
                                     " | BELONGS_TO_THIS_SHOP: " + belongsToThisShop);
                }
                
                debug.put("orderItems", orderItemDetails);
                debug.put("itemsWithShopId", itemsWithShopId);
                debug.put("itemsWithoutShopId", itemsWithoutShopId);
                debug.put("itemsForThisShop", itemsForThisShop);
                
                System.out.println("🔍 ORDER ITEMS WITH SHOP_ID: " + itemsWithShopId);
                System.out.println("🔍 ORDER ITEMS WITHOUT SHOP_ID: " + itemsWithoutShopId);
                System.out.println("🔍 ORDER ITEMS FOR THIS SHOP: " + itemsForThisShop);
                
                // 5. TEST THE ACTUAL QUERY
                List<OrderItem> queryResult = orderItemRepository.findByShopId(shop.getId());
                debug.put("queryResultCount", queryResult.size());
                System.out.println("🔍 QUERY RESULT COUNT (findByShopId): " + queryResult.size());
                
                if (queryResult.isEmpty()) {
                    System.out.println("❌ QUERY RETURNS EMPTY - THIS IS THE PROBLEM!");
                    debug.put("queryProblem", "findByShopId returns empty array");
                } else {
                    System.out.println("✅ QUERY RETURNS DATA - Problem is elsewhere");
                    List<Map<String, Object>> queryResultDetails = new ArrayList<>();
                    for (OrderItem item : queryResult) {
                        Map<String, Object> resultMap = new HashMap<>();
                        resultMap.put("orderItemId", item.getId().toHexString());
                        resultMap.put("productName", item.getProductName());
                        resultMap.put("orderId", item.getOrderId().toHexString());
                        queryResultDetails.add(resultMap);
                    }
                    debug.put("queryResults", queryResultDetails);
                }
                
                // 6. CROSS-CHECK: For each OrderItem without shopId, check if product belongs to this shop
                System.out.println("🔍 CROSS-CHECK: OrderItems without shopId that should belong to this shop:");
                int shouldBelongToThisShop = 0;
                for (OrderItem item : allOrderItems) {
                    if (item.getShopId() == null && item.getProductId() != null) {
                        Optional<Product> productOpt = productRepository.findById(item.getProductId());
                        if (productOpt.isPresent()) {
                            Product product = productOpt.get();
                            if (product.getShopId() != null && product.getShopId().equals(shop.getId())) {
                                shouldBelongToThisShop++;
                                System.out.println("🔍 MISSING LINK: OrderItem " + item.getId().toHexString() + 
                                                 " for product " + product.getName() + 
                                                 " should have shopId " + shop.getId().toHexString());
                            }
                        }
                    }
                }
                debug.put("orderItemsMissingShopId", shouldBelongToThisShop);
                System.out.println("🔍 ORDER ITEMS MISSING SHOP_ID (should belong to this shop): " + shouldBelongToThisShop);
                
            } else {
                debug.put("shopId", "NOT FOUND");
                debug.put("error", "No shop found for provider " + provider.getId().toHexString());
                System.out.println("❌ NO SHOP FOUND FOR PROVIDER: " + provider.getId().toHexString());
            }
            
            // 7. ALL ORDERS IN SYSTEM
            List<Order> allOrders = orderRepository.findAll();
            debug.put("totalOrdersInSystem", allOrders.size());
            System.out.println("🔍 TOTAL ORDERS IN SYSTEM: " + allOrders.size());
            
            System.out.println("🔍 ===== COMPREHENSIVE DEBUG END =====");
            
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            System.err.println("❌ DEBUG ERROR: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("stackTrace", Arrays.toString(e.getStackTrace()));
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

            // ✅ Primary path: shopId on OrderItems
            List<OrderItem> providerOrderItems = orderItemRepository.findByShopId(shop.getId());

            // ✅ Fallback for legacy OrderItems without shopId: filter by provider's productIds
            if (providerOrderItems.isEmpty()) {
                List<ObjectId> productIds = productRepository.findByShopId(shop.getId())
                        .stream().map(Product::getId).collect(Collectors.toList());
                if (!productIds.isEmpty()) {
                    providerOrderItems = orderItemRepository.findByProductIdIn(productIds);
                }
            }

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
                    String clientAvatar = null;
                    if (order.getUser() != null) {
                        User customer = order.getUser();
                        clientName = (customer.getFirstName() != null ? customer.getFirstName() : "") + 
                                   " " + (customer.getLastName() != null ? customer.getLastName() : "");
                        clientName = clientName.trim();
                        if (clientName.isEmpty()) clientName = "Unknown Customer";
                        clientEmail = customer.getEmail() != null ? customer.getEmail() : "unknown@example.com";
                        clientAvatar = customer.getAvatarUrl();  // ✅ Added avatar
                    }
                    
                    dto.setClientName(clientName);
                    dto.setClientEmail(clientEmail);
                    dto.setClientAvatar(clientAvatar);  // ✅ Set avatar
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

            // ✅ Primary path: shopId on OrderItems
            List<OrderItem> providerOrderItems = orderItemRepository.findByShopId(shop.getId());

            // ✅ Fallback for legacy OrderItems without shopId: filter by provider's productIds
            if (providerOrderItems.isEmpty()) {
                List<ObjectId> productIds = productRepository.findByShopId(shop.getId())
                        .stream().map(Product::getId).collect(Collectors.toList());
                if (!productIds.isEmpty()) {
                    providerOrderItems = orderItemRepository.findByProductIdIn(productIds);
                }
            }

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

    /**
     * FIX: Update all OrderItems with missing shopId
     * This is a one-time fix for existing data
     * 
     * @return Map with update statistics
     */
    @PostMapping("/fix-order-items")
    public ResponseEntity<Map<String, Object>> fixOrderItemsShopId(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            Map<String, Object> result = new HashMap<>();
            
            System.out.println("🔧 Starting OrderItems shopId fix...");
            
            // Get all order items
            List<OrderItem> allItems = orderItemRepository.findAll();
            int updatedCount = 0;
            int errorCount = 0;
            int alreadyHasShopId = 0;
            
            System.out.println("📊 Total OrderItems in database: " + allItems.size());
            
            for (OrderItem item : allItems) {
                if (item.getShopId() == null) {
                    if (item.getProductId() != null) {
                        // Find the product
                        Optional<Product> productOpt = productRepository.findById(item.getProductId());
                        if (productOpt.isPresent()) {
                            Product product = productOpt.get();
                            if (product.getShopId() != null) {
                                // Update the order item
                                item.setShopId(product.getShopId());
                                orderItemRepository.save(item);
                                updatedCount++;
                                System.out.println("✅ Updated OrderItem " + item.getId() + " with shopId " + product.getShopId());
                            } else {
                                errorCount++;
                                System.err.println("⚠️ Product " + product.getId() + " has no shopId");
                            }
                        } else {
                            errorCount++;
                            System.err.println("❌ Product not found for OrderItem " + item.getId() + " (productId: " + item.getProductId() + ")");
                        }
                    } else {
                        errorCount++;
                        System.err.println("❌ OrderItem " + item.getId() + " has no productId");
                    }
                } else {
                    alreadyHasShopId++;
                }
            }
            
            System.out.println("🎉 Fix complete!");
            System.out.println("📊 Total items: " + allItems.size());
            System.out.println("✅ Updated: " + updatedCount);
            System.out.println("✓ Already had shopId: " + alreadyHasShopId);
            System.out.println("❌ Errors: " + errorCount);
            
            result.put("totalItems", allItems.size());
            result.put("updatedCount", updatedCount);
            result.put("alreadyHasShopId", alreadyHasShopId);
            result.put("errorCount", errorCount);
            result.put("message", "Fixed " + updatedCount + " order items. " + alreadyHasShopId + " already had shopId. " + errorCount + " errors.");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("❌ Fix failed: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("stackTrace", Arrays.toString(e.getStackTrace()));
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // ==================== HELPER METHODS ====================

    private User getAuthenticatedProvider(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
    }
}
