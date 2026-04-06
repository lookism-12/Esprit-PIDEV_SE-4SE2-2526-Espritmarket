package esprit_market.controller.providerController;

import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.dto.cartDto.CartResponse;
import esprit_market.dto.cartDto.ProviderOrderDTO;
import esprit_market.entity.cart.Cart;
import esprit_market.entity.cart.CartItem;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.CartItemRepository;
import esprit_market.repository.cartRepository.CartRepository;
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

@RestController
@RequestMapping("/api/provider")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PROVIDER')")
public class ProviderDashboardController {

    private final ICartService cartService;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;

    /**
     * DEBUG: Check provider data and orders
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
            
            // Check all orders
            List<Cart> allOrders = cartRepository.findByStatusIn(Arrays.asList(
                    CartStatus.PENDING, CartStatus.CONFIRMED, CartStatus.CANCELLED
            ));
            debug.put("totalOrdersInSystem", allOrders.size());
            
            // Check all cart items
            List<CartItem> allCartItems = cartItemRepository.findAll();
            debug.put("totalCartItemsInSystem", allCartItems.size());
            
            // Check each order's items
            List<Map<String, Object>> orderDetails = new ArrayList<>();
            for (Cart order : allOrders) {
                Map<String, Object> orderMap = new HashMap<>();
                orderMap.put("orderId", order.getId().toHexString());
                orderMap.put("status", order.getStatus().toString());
                orderMap.put("userId", order.getUserId() != null ? order.getUserId().toHexString() : "NULL");
                
                List<CartItem> items = cartItemRepository.findByCartId(order.getId());
                orderMap.put("itemCount", items.size());
                
                List<Map<String, Object>> itemDetails = new ArrayList<>();
                for (CartItem item : items) {
                    Map<String, Object> itemMap = new HashMap<>();
                    itemMap.put("cartItemId", item.getId() != null ? item.getId().toHexString() : "NULL");
                    itemMap.put("productId", item.getProductId() != null ? item.getProductId().toHexString() : "NULL");
                    itemMap.put("productName", item.getProductName());
                    itemMap.put("quantity", item.getQuantity());
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
     * Get all orders for the current provider's products
     * Only returns orders with status other than DRAFT
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
                // Return empty list instead of 500 error
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            Shop shop = shopOpt.get();
            System.out.println("🔍 DEBUG: Shop ID: " + shop.getId());

            // Get all products owned by this provider
            List<Product> providerProducts = productRepository.findByShopId(shop.getId());
            System.out.println("🔍 DEBUG: Provider products count: " + providerProducts.size());
            
            if (providerProducts.isEmpty()) {
                System.out.println("⚠️ WARNING: No products found for shop " + shop.getId());
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            providerProducts.forEach(p -> System.out.println("  - Product: " + p.getId() + " | " + p.getName()));
            
            // Store as String set for reliable comparison (ObjectId equality can be tricky)
            Set<String> productIdStrings = providerProducts.stream()
                    .map(p -> p.getId().toHexString())
                    .collect(Collectors.toSet());
            System.out.println("🔍 DEBUG: Product ID strings: " + productIdStrings);

            // Get all non-draft orders
            List<CartStatus> orderStatuses = Arrays.asList(
                    CartStatus.PENDING, CartStatus.CONFIRMED, CartStatus.CANCELLED,
                    CartStatus.PROCESSING, CartStatus.SHIPPED, CartStatus.DELIVERED,
                    CartStatus.PARTIALLY_CANCELLED, CartStatus.PARTIALLY_REFUNDED, CartStatus.REFUNDED
            );
            List<Cart> allOrders = cartRepository.findByStatusIn(orderStatuses);
            System.out.println("🔍 DEBUG: Total non-draft orders: " + allOrders.size());

            // Filter orders that contain provider's products
            List<ProviderOrderDTO> providerOrders = new ArrayList<>();

            for (Cart order : allOrders) {
                if (order == null || order.getId() == null) {
                    System.out.println("⚠️ WARNING: Null order or order ID, skipping");
                    continue;
                }
                
                List<CartItem> orderItems = cartItemRepository.findByCartId(order.getId());
                System.out.println("🔍 DEBUG: Order " + order.getId() + " has " + orderItems.size() + " items");

                // Check if this order contains any of provider's products
                List<CartItem> providerItems = orderItems.stream()
                        .filter(item -> {
                            // Null safety check
                            if (item == null || item.getProductId() == null) {
                                System.out.println("  - Item or productId is NULL, skipping");
                                return false;
                            }
                            String itemProductId = item.getProductId().toHexString();
                            boolean contains = productIdStrings.contains(itemProductId);
                            System.out.println("  - Item product: " + itemProductId + " | Match: " + contains);
                            return contains;
                        })
                        .collect(Collectors.toList());

                System.out.println("🔍 DEBUG: Provider items in order: " + providerItems.size());

                if (!providerItems.isEmpty()) {
                    // For each provider item in this order, create an entry
                    for (CartItem item : providerItems) {
                        ProviderOrderDTO dto = new ProviderOrderDTO();
                        dto.setOrderId(order.getId().toHexString());
                        dto.setCartItemId(item.getId() != null ? item.getId().toHexString() : "unknown");
                        
                        // Get user info safely
                        String clientName = "Unknown Customer";
                        String clientEmail = "unknown@example.com";
                        if (order.getUserId() != null) {
                            Optional<User> customerOpt = userRepository.findById(order.getUserId());
                            if (customerOpt.isPresent()) {
                                User customer = customerOpt.get();
                                clientName = (customer.getFirstName() != null ? customer.getFirstName() : "") + 
                                           " " + (customer.getLastName() != null ? customer.getLastName() : "");
                                clientName = clientName.trim();
                                if (clientName.isEmpty()) clientName = "Unknown Customer";
                                clientEmail = customer.getEmail() != null ? customer.getEmail() : "unknown@example.com";
                            }
                        }
                        
                        dto.setClientName(clientName);
                        dto.setClientEmail(clientEmail);
                        dto.setProductName(item.getProductName() != null ? item.getProductName() : "Unknown Product");
                        dto.setQuantity(item.getQuantity() != null ? item.getQuantity() : 0);
                        dto.setUnitPrice(item.getUnitPrice() != null ? item.getUnitPrice() : 0.0);
                        dto.setSubTotal(item.getSubTotal() != null ? item.getSubTotal() : 0.0);
                        dto.setOrderStatus(order.getStatus() != null ? order.getStatus().toString() : "UNKNOWN");
                        dto.setOrderDate(order.getCreationDate());

                        providerOrders.add(dto);
                    }
                }
            }

            System.out.println("🔍 DEBUG: Final provider orders count: " + providerOrders.size());
            return ResponseEntity.ok(providerOrders);
        } catch (Exception e) {
            System.err.println("❌ Provider Orders Error: " + e.getMessage());
            e.printStackTrace();
            
            // Return empty list with error logged instead of 500
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Update order status (CONFIRM or CANCEL)
     */
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<ProviderOrderDTO> updateOrderStatus(
            @PathVariable String orderId,
            @RequestParam String newStatus,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            System.out.println("🔍 UPDATE: Provider " + provider.getId() + " updating order " + orderId + " to " + newStatus);
            
            ObjectId orderIdObj = new ObjectId(orderId);

            // Get the order
            Optional<Cart> orderOpt = cartRepository.findById(orderIdObj);
            if (!orderOpt.isPresent()) {
                System.err.println("❌ Order not found: " + orderId);
                return ResponseEntity.notFound().build();
            }
            
            Cart order = orderOpt.get();

            // Verify provider owns products in this order
            try {
                verifyProviderOwnsOrder(provider, order);
            } catch (RuntimeException e) {
                System.err.println("❌ Authorization failed: " + e.getMessage());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Parse status string to enum
            CartStatus statusEnum;
            try {
                statusEnum = CartStatus.valueOf(newStatus.toUpperCase());
            } catch (IllegalArgumentException e) {
                System.err.println("❌ Invalid status: " + newStatus);
                return ResponseEntity.badRequest().build();
            }

            // Handle status changes
            if (statusEnum == CartStatus.CONFIRMED) {
                order.setStatus(CartStatus.CONFIRMED);
                cartRepository.save(order);
                System.out.println("✅ Order confirmed: " + orderId);
            } else if (statusEnum == CartStatus.CANCELLED) {
                // Restore stock for all items in this order
                List<CartItem> items = cartItemRepository.findByCartId(order.getId());
                for (CartItem item : items) {
                    if (item.getProductId() != null) {
                        Optional<Product> productOpt = productRepository.findById(item.getProductId());
                        if (productOpt.isPresent()) {
                            Product product = productOpt.get();
                            int currentQty = product.getQuantity(); // Product.quantity is primitive int
                            Integer itemQtyWrapper = item.getQuantity(); // CartItem.quantity is Integer
                            int itemQty = itemQtyWrapper != null ? itemQtyWrapper : 0;
                            product.setQuantity(currentQty + itemQty);
                            productRepository.save(product);
                            System.out.println("✅ Stock restored for product " + product.getId() + ": +" + itemQty);
                        }
                    }
                }
                order.setStatus(CartStatus.CANCELLED);
                cartRepository.save(order);
                System.out.println("✅ Order cancelled: " + orderId);
            } else {
                System.err.println("⚠️ Unsupported status change: " + statusEnum);
                return ResponseEntity.badRequest().build();
            }

            // Return updated order DTO (get first provider item)
            List<CartItem> orderItems = cartItemRepository.findByCartId(order.getId());
            
            // Get provider's products to filter
            Shop shop = shopRepository.findByOwnerId(provider.getId())
                    .orElseThrow(() -> new RuntimeException("Provider shop not found"));
            List<Product> providerProducts = productRepository.findByShopId(shop.getId());
            Set<String> productIdStrings = providerProducts.stream()
                    .map(p -> p.getId().toHexString())
                    .collect(Collectors.toSet());
            
            // Find first provider item
            CartItem firstProviderItem = orderItems.stream()
                    .filter(item -> item.getProductId() != null && 
                            productIdStrings.contains(item.getProductId().toHexString()))
                    .findFirst()
                    .orElse(orderItems.isEmpty() ? null : orderItems.get(0));
            
            ProviderOrderDTO dto = new ProviderOrderDTO();
            dto.setOrderId(order.getId().toHexString());
            
            // Get user info safely
            String clientName = "Unknown Customer";
            String clientEmail = "unknown@example.com";
            if (order.getUserId() != null) {
                Optional<User> customerOpt = userRepository.findById(order.getUserId());
                if (customerOpt.isPresent()) {
                    User customer = customerOpt.get();
                    clientName = (customer.getFirstName() != null ? customer.getFirstName() : "") + 
                               " " + (customer.getLastName() != null ? customer.getLastName() : "");
                    clientName = clientName.trim();
                    if (clientName.isEmpty()) clientName = "Unknown Customer";
                    clientEmail = customer.getEmail() != null ? customer.getEmail() : "unknown@example.com";
                }
            }
            
            dto.setClientName(clientName);
            dto.setClientEmail(clientEmail);
            
            // Get first provider item for response
            if (firstProviderItem != null) {
                dto.setCartItemId(firstProviderItem.getId() != null ? firstProviderItem.getId().toHexString() : "unknown");
                dto.setProductName(firstProviderItem.getProductName() != null ? firstProviderItem.getProductName() : "Unknown Product");
                dto.setQuantity(firstProviderItem.getQuantity() != null ? firstProviderItem.getQuantity() : 0);
                dto.setUnitPrice(firstProviderItem.getUnitPrice() != null ? firstProviderItem.getUnitPrice() : 0.0);
                dto.setSubTotal(firstProviderItem.getSubTotal() != null ? firstProviderItem.getSubTotal() : 0.0);
            }
            
            dto.setOrderStatus(order.getStatus().toString());
            dto.setOrderDate(order.getCreationDate());

            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ Invalid order ID format: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("❌ Update Order Status Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update individual product status within an order
     * This allows providers to update status of their specific products only
     */
    @PutMapping("/orders/{orderId}/items/{cartItemId}/status")
    public ResponseEntity<ProviderOrderDTO> updateProductStatus(
            @PathVariable String orderId,
            @PathVariable String cartItemId,
            @RequestParam String newStatus,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            System.out.println("🔍 UPDATE ITEM: Provider " + provider.getId() + " updating item " + cartItemId + " to " + newStatus);
            
            ObjectId orderIdObj = new ObjectId(orderId);
            ObjectId cartItemIdObj = new ObjectId(cartItemId);

            // Get the order
            Optional<Cart> orderOpt = cartRepository.findById(orderIdObj);
            if (!orderOpt.isPresent()) {
                System.err.println("❌ Order not found: " + orderId);
                return ResponseEntity.notFound().build();
            }
            
            Cart order = orderOpt.get();

            // Get the specific cart item
            Optional<CartItem> cartItemOpt = cartItemRepository.findById(cartItemIdObj);
            if (!cartItemOpt.isPresent()) {
                System.err.println("❌ Cart item not found: " + cartItemId);
                return ResponseEntity.notFound().build();
            }
            
            CartItem cartItem = cartItemOpt.get();

            // Verify this cart item belongs to this order
            if (!cartItem.getCartId().equals(order.getId())) {
                System.err.println("❌ Cart item does not belong to this order");
                return ResponseEntity.badRequest().build();
            }

            // Verify provider owns this product
            Shop shop = shopRepository.findByOwnerId(provider.getId())
                    .orElseThrow(() -> new RuntimeException("Provider shop not found"));
            List<Product> providerProducts = productRepository.findByShopId(shop.getId());
            Set<String> productIdStrings = providerProducts.stream()
                    .map(p -> p.getId().toHexString())
                    .collect(Collectors.toSet());

            if (cartItem.getProductId() == null || !productIdStrings.contains(cartItem.getProductId().toHexString())) {
                System.err.println("❌ Provider does not own this product");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Parse status string to enum
            CartStatus statusEnum;
            try {
                statusEnum = CartStatus.valueOf(newStatus.toUpperCase());
            } catch (IllegalArgumentException e) {
                System.err.println("❌ Invalid status: " + newStatus);
                return ResponseEntity.badRequest().build();
            }

            // Update the order status (this affects the whole order for now)
            // In a more complex system, you might have item-level status
            if (statusEnum == CartStatus.CONFIRMED) {
                order.setStatus(CartStatus.CONFIRMED);
                cartRepository.save(order);
                System.out.println("✅ Order confirmed: " + orderId);
            } else if (statusEnum == CartStatus.CANCELLED) {
                // Restore stock for this specific product
                if (cartItem.getProductId() != null) {
                    Optional<Product> productOpt = productRepository.findById(cartItem.getProductId());
                    if (productOpt.isPresent()) {
                        Product product = productOpt.get();
                        int currentQty = product.getQuantity(); // Product.quantity is primitive int
                        Integer itemQtyWrapper = cartItem.getQuantity(); // CartItem.quantity is Integer
                        int itemQty = itemQtyWrapper != null ? itemQtyWrapper : 0;
                        product.setQuantity(currentQty + itemQty);
                        productRepository.save(product);
                        System.out.println("✅ Stock restored for product " + product.getId() + ": +" + itemQty);
                    }
                }
                order.setStatus(CartStatus.CANCELLED);
                cartRepository.save(order);
                System.out.println("✅ Order cancelled: " + orderId);
            } else {
                System.err.println("⚠️ Unsupported status change: " + statusEnum);
                return ResponseEntity.badRequest().build();
            }

            // Return updated DTO
            ProviderOrderDTO dto = new ProviderOrderDTO();
            dto.setOrderId(order.getId().toHexString());
            dto.setCartItemId(cartItem.getId().toHexString());
            
            // Get user info safely
            String clientName = "Unknown Customer";
            String clientEmail = "unknown@example.com";
            if (order.getUserId() != null) {
                Optional<User> customerOpt = userRepository.findById(order.getUserId());
                if (customerOpt.isPresent()) {
                    User customer = customerOpt.get();
                    clientName = (customer.getFirstName() != null ? customer.getFirstName() : "") + 
                               " " + (customer.getLastName() != null ? customer.getLastName() : "");
                    clientName = clientName.trim();
                    if (clientName.isEmpty()) clientName = "Unknown Customer";
                    clientEmail = customer.getEmail() != null ? customer.getEmail() : "unknown@example.com";
                }
            }
            
            dto.setClientName(clientName);
            dto.setClientEmail(clientEmail);
            dto.setProductName(cartItem.getProductName() != null ? cartItem.getProductName() : "Unknown Product");
            dto.setQuantity(cartItem.getQuantity() != null ? cartItem.getQuantity() : 0);
            dto.setUnitPrice(cartItem.getUnitPrice() != null ? cartItem.getUnitPrice() : 0.0);
            dto.setSubTotal(cartItem.getSubTotal() != null ? cartItem.getSubTotal() : 0.0);
            dto.setOrderStatus(order.getStatus().toString());
            dto.setOrderDate(order.getCreationDate());

            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ Invalid ID format: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("❌ Update Product Status Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get detailed order information
     */
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<CartResponse> getOrderDetails(
            @PathVariable String orderId,
            Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            ObjectId orderIdObj = new ObjectId(orderId);

            // Get the order
            Cart order = cartRepository.findById(orderIdObj)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Verify provider owns products in this order
            verifyProviderOwnsOrder(provider, order);

            // Return order details
            return ResponseEntity.ok(cartService.getOrderById(provider.getId(), orderIdObj));
        } catch (Exception e) {
            System.err.println("Get Order Details Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get provider dashboard statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(Authentication authentication) {
        try {
            User provider = getAuthenticatedProvider(authentication);
            System.out.println("🔍 STATS: Provider ID: " + provider.getId());

            // Get provider's shop
            Shop shop = shopRepository.findByOwnerId(provider.getId())
                    .orElseThrow(() -> new RuntimeException("Provider shop not found"));
            System.out.println("🔍 STATS: Shop ID: " + shop.getId());

            // Get all products owned by this provider
            List<Product> providerProducts = productRepository.findByShopId(shop.getId());
            System.out.println("🔍 STATS: Provider products count: " + providerProducts.size());
            
            Set<String> productIdStrings = providerProducts.stream()
                    .map(p -> p.getId().toHexString())
                    .collect(Collectors.toSet());

            // Count orders by status
            List<CartStatus> orderStatuses = Arrays.asList(
                    CartStatus.PENDING, CartStatus.CONFIRMED, CartStatus.CANCELLED,
                    CartStatus.PROCESSING, CartStatus.SHIPPED, CartStatus.DELIVERED,
                    CartStatus.PARTIALLY_CANCELLED, CartStatus.PARTIALLY_REFUNDED, CartStatus.REFUNDED
            );
            List<Cart> allOrders = cartRepository.findByStatusIn(orderStatuses);
            System.out.println("🔍 STATS: Total orders in system: " + allOrders.size());

            Map<String, Integer> statusCounts = new HashMap<>();
            Double totalRevenue = 0.0;
            int providerOrderCount = 0;

            for (Cart order : allOrders) {
                List<CartItem> orderItems = cartItemRepository.findByCartId(order.getId());

                // Check if this order contains any of provider's products
                List<CartItem> providerItems = orderItems.stream()
                        .filter(item -> item.getProductId() != null && 
                                productIdStrings.contains(item.getProductId().toHexString()))
                        .collect(Collectors.toList());

                if (!providerItems.isEmpty()) {
                    providerOrderCount++;
                    
                    // Count status
                    String status = order.getStatus().toString();
                    statusCounts.put(status, statusCounts.getOrDefault(status, 0) + 1);

                    // Calculate revenue for confirmed/delivered orders
                    if (order.getStatus() == CartStatus.CONFIRMED || 
                        order.getStatus() == CartStatus.DELIVERED ||
                        order.getStatus() == CartStatus.SHIPPED) {
                        for (CartItem item : providerItems) {
                            if (item.getSubTotal() != null) {
                                totalRevenue += item.getSubTotal();
                            }
                        }
                    }
                }
            }

            System.out.println("🔍 STATS: Provider orders: " + providerOrderCount);
            System.out.println("🔍 STATS: Total revenue: " + totalRevenue);

            Map<String, Object> stats = new HashMap<>();
            stats.put("pendingOrders", statusCounts.getOrDefault("PENDING", 0));
            stats.put("confirmedOrders", statusCounts.getOrDefault("CONFIRMED", 0));
            stats.put("cancelledOrders", statusCounts.getOrDefault("CANCELLED", 0));
            stats.put("totalOrders", providerOrderCount); // Fixed: only count provider orders
            stats.put("totalRevenue", totalRevenue);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            System.err.println("❌ Statistics Error: " + e.getMessage());
            e.printStackTrace();
            
            // Return empty stats instead of 500 error
            Map<String, Object> emptyStats = new HashMap<>();
            emptyStats.put("pendingOrders", 0);
            emptyStats.put("confirmedOrders", 0);
            emptyStats.put("cancelledOrders", 0);
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

    private void verifyProviderOwnsOrder(User provider, Cart order) {
        Shop shop = shopRepository.findByOwnerId(provider.getId())
                .orElseThrow(() -> new RuntimeException("Provider shop not found"));

        List<Product> providerProducts = productRepository.findByShopId(shop.getId());
        Set<String> productIdStrings = providerProducts.stream()
                .map(p -> p.getId().toHexString())
                .collect(Collectors.toSet());

        List<CartItem> orderItems = cartItemRepository.findByCartId(order.getId());
        boolean hasProviderProduct = orderItems.stream()
                .anyMatch(item -> item.getProductId() != null && 
                        productIdStrings.contains(item.getProductId().toHexString()));

        if (!hasProviderProduct) {
            throw new RuntimeException("Unauthorized: Provider does not own any products in this order");
        }
    }
}
