package esprit_market.controller.testController;

import esprit_market.Enum.cartEnum.CartStatus;
import esprit_market.Enum.marketplaceEnum.ProductStatus;
import esprit_market.Enum.userEnum.Role;
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
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.Optional;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
public class TestDataController {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Create test data for provider dashboard testing
     */
    @PostMapping("/create-test-data")
    public ResponseEntity<Map<String, Object>> createTestData() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // 1. Create test provider user
            User provider = User.builder()
                    .firstName("Test")
                    .lastName("Provider")
                    .email("provider@test.com")
                    .password(passwordEncoder.encode("password123"))
                    .roles(Arrays.asList(Role.PROVIDER))
                    .enabled(true)
                    .build();
            provider = userRepository.save(provider);
            result.put("providerId", provider.getId().toHexString());
            result.put("providerEmail", provider.getEmail());

            // 2. Create test client user
            User client = User.builder()
                    .firstName("Test")
                    .lastName("Client")
                    .email("client@test.com")
                    .password(passwordEncoder.encode("password123"))
                    .roles(Arrays.asList(Role.CLIENT))
                    .enabled(true)
                    .build();
            client = userRepository.save(client);
            result.put("clientId", client.getId().toHexString());

            // 3. Create provider's shop
            Shop shop = Shop.builder()
                    .name("Test Provider Shop")
                    .description("A test shop for provider dashboard testing")
                    .address("123 Test Street")
                    .phone("+216 12 345 678")
                    .ownerId(provider.getId())
                    .build();
            shop = shopRepository.save(shop);
            result.put("shopId", shop.getId().toHexString());

            // 4. Create test products
            Product product1 = Product.builder()
                    .name("Test Product 1")
                    .description("First test product")
                    .shopId(shop.getId())
                    .price(50.0)
                    .stock(100)
                    .quantity(100)
                    .status(ProductStatus.APPROVED)
                    .createdAt(LocalDateTime.now())
                    .build();
            product1 = productRepository.save(product1);

            Product product2 = Product.builder()
                    .name("Test Product 2")
                    .description("Second test product")
                    .shopId(shop.getId())
                    .price(75.0)
                    .stock(50)
                    .quantity(50)
                    .status(ProductStatus.APPROVED)
                    .createdAt(LocalDateTime.now())
                    .build();
            product2 = productRepository.save(product2);

            result.put("product1Id", product1.getId().toHexString());
            result.put("product2Id", product2.getId().toHexString());

            // 5. Create test orders with different statuses
            
            // Order 1: PENDING
            Cart order1 = Cart.builder()
                    .user(client)
                    .userId(client.getId())
                    .status(CartStatus.PENDING)
                    .creationDate(LocalDateTime.now().minusDays(2))
                    .lastUpdated(LocalDateTime.now().minusDays(2))
                    .subtotal(125.0)
                    .total(125.0)
                    .build();
            order1 = cartRepository.save(order1);

            CartItem item1 = CartItem.builder()
                    .cartId(order1.getId())
                    .productId(product1.getId())
                    .productName(product1.getName())
                    .quantity(2)
                    .unitPrice(product1.getPrice())
                    .subTotal(2 * product1.getPrice())
                    .build();
            cartItemRepository.save(item1);

            CartItem item2 = CartItem.builder()
                    .cartId(order1.getId())
                    .productId(product2.getId())
                    .productName(product2.getName())
                    .quantity(1)
                    .unitPrice(product2.getPrice())
                    .subTotal(1 * product2.getPrice())
                    .build();
            cartItemRepository.save(item2);

            // Order 2: CONFIRMED
            Cart order2 = Cart.builder()
                    .user(client)
                    .userId(client.getId())
                    .status(CartStatus.CONFIRMED)
                    .creationDate(LocalDateTime.now().minusDays(1))
                    .lastUpdated(LocalDateTime.now().minusDays(1))
                    .subtotal(50.0)
                    .total(50.0)
                    .build();
            order2 = cartRepository.save(order2);

            CartItem item3 = CartItem.builder()
                    .cartId(order2.getId())
                    .productId(product1.getId())
                    .productName(product1.getName())
                    .quantity(1)
                    .unitPrice(product1.getPrice())
                    .subTotal(1 * product1.getPrice())
                    .build();
            cartItemRepository.save(item3);

            // Order 3: CANCELLED
            Cart order3 = Cart.builder()
                    .user(client)
                    .userId(client.getId())
                    .status(CartStatus.CANCELLED)
                    .creationDate(LocalDateTime.now().minusHours(12))
                    .lastUpdated(LocalDateTime.now().minusHours(12))
                    .subtotal(75.0)
                    .total(75.0)
                    .build();
            order3 = cartRepository.save(order3);

            CartItem item4 = CartItem.builder()
                    .cartId(order3.getId())
                    .productId(product2.getId())
                    .productName(product2.getName())
                    .quantity(1)
                    .unitPrice(product2.getPrice())
                    .subTotal(1 * product2.getPrice())
                    .build();
            cartItemRepository.save(item4);

            result.put("order1Id", order1.getId().toHexString());
            result.put("order2Id", order2.getId().toHexString());
            result.put("order3Id", order3.getId().toHexString());
            result.put("message", "Test data created successfully!");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Create cart items for existing products and carts
     */
    @PostMapping("/create-cart-items-for-existing-data")
    public ResponseEntity<Map<String, Object>> createCartItemsForExistingData() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // Find existing products with the shopId from your data
            ObjectId existingShopId = new ObjectId("69ac4ad50d2cd372e2b3a7c7");
            List<Product> existingProducts = productRepository.findByShopId(existingShopId);
            result.put("foundProducts", existingProducts.size());
            
            if (existingProducts.isEmpty()) {
                result.put("error", "No products found with shopId: " + existingShopId);
                return ResponseEntity.ok(result);
            }
            
            // Find existing carts
            List<Cart> existingCarts = cartRepository.findByStatusIn(Arrays.asList(
                    CartStatus.PENDING, CartStatus.CONFIRMED, CartStatus.CANCELLED
            ));
            result.put("foundCarts", existingCarts.size());
            
            if (existingCarts.isEmpty()) {
                result.put("error", "No carts found");
                return ResponseEntity.ok(result);
            }
            
            // Create cart items linking existing carts to existing products
            int itemsCreated = 0;
            for (int i = 0; i < Math.min(existingCarts.size(), 3); i++) {
                Cart cart = existingCarts.get(i);
                Product product = existingProducts.get(i % existingProducts.size());
                
                // Check if cart item already exists
                Optional<CartItem> existingItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId());
                if (existingItem.isPresent()) {
                    continue; // Skip if already exists
                }
                
                CartItem newItem = CartItem.builder()
                        .cartId(cart.getId())
                        .productId(product.getId())
                        .productName(product.getName())
                        .quantity(1)
                        .unitPrice(product.getPrice())
                        .subTotal(product.getPrice())
                        .build();
                cartItemRepository.save(newItem);
                itemsCreated++;
            }
            
            result.put("cartItemsCreated", itemsCreated);
            result.put("message", "Cart items created for existing data!");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Check if provider exists for existing shop and create if needed
     */
    @PostMapping("/create-provider-for-existing-shop")
    public ResponseEntity<Map<String, Object>> createProviderForExistingShop() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // Check if shop exists with the ID from your data
            ObjectId existingShopId = new ObjectId("69ac4ad50d2cd372e2b3a7c7");
            Optional<Shop> shopOpt = shopRepository.findById(existingShopId);
            
            if (!shopOpt.isPresent()) {
                result.put("error", "Shop not found with ID: " + existingShopId);
                return ResponseEntity.ok(result);
            }
            
            Shop shop = shopOpt.get();
            result.put("shopId", shop.getId().toHexString());
            result.put("shopName", shop.getName());
            
            // Check if shop has an owner
            if (shop.getOwnerId() != null) {
                Optional<User> ownerOpt = userRepository.findById(shop.getOwnerId());
                if (ownerOpt.isPresent()) {
                    User owner = ownerOpt.get();
                    result.put("existingOwnerId", owner.getId().toHexString());
                    result.put("existingOwnerEmail", owner.getEmail());
                    result.put("existingOwnerRoles", owner.getRoles());
                    
                    // Check if owner has PROVIDER role
                    if (owner.getRoles().contains(Role.PROVIDER)) {
                        result.put("message", "Provider already exists for this shop");
                        return ResponseEntity.ok(result);
                    } else {
                        // Add PROVIDER role to existing owner
                        List<Role> roles = new ArrayList<>(owner.getRoles());
                        if (!roles.contains(Role.PROVIDER)) {
                            roles.add(Role.PROVIDER);
                            owner.setRoles(roles);
                            userRepository.save(owner);
                            result.put("message", "Added PROVIDER role to existing shop owner");
                            return ResponseEntity.ok(result);
                        }
                    }
                }
            }
            
            // Create new provider for the shop
            User newProvider = User.builder()
                    .firstName("Shop")
                    .lastName("Provider")
                    .email("provider@test.com")
                    .password(passwordEncoder.encode("password123"))
                    .roles(Arrays.asList(Role.PROVIDER))
                    .enabled(true)
                    .build();
            newProvider = userRepository.save(newProvider);
            
            // Update shop to have this provider as owner
            shop.setOwnerId(newProvider.getId());
            shopRepository.save(shop);
            
            result.put("newProviderId", newProvider.getId().toHexString());
            result.put("newProviderEmail", newProvider.getEmail());
            result.put("message", "Created new provider and assigned to existing shop");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Clean up test data
     */
    @DeleteMapping("/cleanup-test-data")
    public ResponseEntity<Map<String, String>> cleanupTestData() {
        try {
            // Delete test users and their related data
            userRepository.findByEmail("provider@test.com").ifPresent(user -> {
                // Delete shop and products
                shopRepository.findByOwnerId(user.getId()).ifPresent(shop -> {
                    productRepository.findByShopId(shop.getId()).forEach(productRepository::delete);
                    shopRepository.delete(shop);
                });
                userRepository.delete(user);
            });

            userRepository.findByEmail("client@test.com").ifPresent(user -> {
                // Delete carts and cart items
                cartRepository.findByUser(user).forEach(cart -> {
                    cartItemRepository.findByCartId(cart.getId()).forEach(cartItemRepository::delete);
                    cartRepository.delete(cart);
                });
                userRepository.delete(user);
            });

            Map<String, String> result = new HashMap<>();
            result.put("message", "Test data cleaned up successfully!");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}