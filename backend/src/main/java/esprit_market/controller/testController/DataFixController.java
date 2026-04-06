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
import java.util.*;
import java.util.stream.Collectors;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/fix")
@RequiredArgsConstructor
public class DataFixController {

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Fix your existing data to work with provider dashboard
     */
    @PostMapping("/fix-existing-data")
    public ResponseEntity<Map<String, Object>> fixExistingData() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // Step 1: Find or create provider user
            User provider = userRepository.findByEmail("provider@test.com")
                    .orElseGet(() -> {
                        User newProvider = User.builder()
                                .firstName("Test")
                                .lastName("Provider")
                                .email("provider@test.com")
                                .password(passwordEncoder.encode("password123"))
                                .roles(Arrays.asList(Role.PROVIDER))
                                .enabled(true)
                                .build();
                        return userRepository.save(newProvider);
                    });
            
            result.put("providerId", provider.getId().toHexString());
            result.put("providerEmail", provider.getEmail());
            
            // Step 2: Find your existing shop or create one
            ObjectId existingShopId = new ObjectId("69ac4ad50d2cd372e2b3a7c7");
            Shop shop = shopRepository.findById(existingShopId)
                    .orElseGet(() -> {
                        Shop newShop = Shop.builder()
                                .name("Main Shop")
                                .description("Main marketplace shop")
                                .address("123 Main Street")
                                .phone("+216 12 345 678")
                                .ownerId(provider.getId())
                                .build();
                        newShop.setId(existingShopId); // Force the ID
                        return shopRepository.save(newShop);
                    });
            
            // Update shop owner to be our provider
            shop.setOwnerId(provider.getId());
            shopRepository.save(shop);
            
            result.put("shopId", shop.getId().toHexString());
            result.put("shopName", shop.getName());
            
            // Step 3: Get all your existing products and ensure they belong to this shop
            List<Product> allProducts = productRepository.findAll();
            int updatedProducts = 0;
            for (Product product : allProducts) {
                if (product.getShopId() == null || !product.getShopId().equals(shop.getId())) {
                    product.setShopId(shop.getId());
                    productRepository.save(product);
                    updatedProducts++;
                }
                // Ensure products are approved
                if (product.getStatus() != ProductStatus.APPROVED) {
                    product.setStatus(ProductStatus.APPROVED);
                    productRepository.save(product);
                }
            }
            
            result.put("totalProducts", allProducts.size());
            result.put("updatedProducts", updatedProducts);
            
            // Step 4: Get all existing carts and create cart items
            List<Cart> existingCarts = cartRepository.findByStatusIn(Arrays.asList(
                    CartStatus.PENDING, CartStatus.CONFIRMED, CartStatus.CANCELLED,
                    CartStatus.PROCESSING, CartStatus.SHIPPED, CartStatus.DELIVERED
            ));
            
            result.put("totalCarts", existingCarts.size());
            
            // Step 5: Create cart items linking carts to products
            int cartItemsCreated = 0;
            List<Product> shopProducts = productRepository.findByShopId(shop.getId());
            
            for (Cart cart : existingCarts) {
                // Check if this cart already has items
                List<CartItem> existingItems = cartItemRepository.findByCartId(cart.getId());
                if (existingItems.isEmpty() && !shopProducts.isEmpty()) {
                    // Create 1-2 random cart items for this cart
                    int itemCount = Math.min(2, shopProducts.size());
                    for (int i = 0; i < itemCount; i++) {
                        Product randomProduct = shopProducts.get(i % shopProducts.size());
                        
                        CartItem newItem = CartItem.builder()
                                .cartId(cart.getId())
                                .productId(randomProduct.getId())
                                .productName(randomProduct.getName())
                                .quantity(1 + (i % 3)) // 1-3 quantity
                                .unitPrice(randomProduct.getPrice())
                                .subTotal(randomProduct.getPrice() * (1 + (i % 3)))
                                .build();
                        
                        cartItemRepository.save(newItem);
                        cartItemsCreated++;
                    }
                }
            }
            
            result.put("cartItemsCreated", cartItemsCreated);
            
            // Step 6: Verify the fix
            List<Product> providerProducts = productRepository.findByShopId(shop.getId());
            Set<String> productIdStrings = providerProducts.stream()
                    .map(p -> p.getId().toHexString())
                    .collect(Collectors.toSet());
            
            int ordersWithProviderProducts = 0;
            for (Cart cart : existingCarts) {
                List<CartItem> items = cartItemRepository.findByCartId(cart.getId());
                boolean hasProviderProduct = items.stream()
                        .anyMatch(item -> item.getProductId() != null && 
                                productIdStrings.contains(item.getProductId().toHexString()));
                if (hasProviderProduct) {
                    ordersWithProviderProducts++;
                }
            }
            
            result.put("ordersWithProviderProducts", ordersWithProviderProducts);
            result.put("message", "Data fixed successfully! Provider should now see orders.");
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Check current data status
     */
    @GetMapping("/check-data")
    public ResponseEntity<Map<String, Object>> checkData() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // Check users
            long totalUsers = userRepository.count();
            long providers = userRepository.findAll().stream()
                    .mapToLong(user -> user.getRoles().contains(Role.PROVIDER) ? 1 : 0)
                    .sum();
            
            result.put("totalUsers", totalUsers);
            result.put("providers", providers);
            
            // Check shops
            long totalShops = shopRepository.count();
            result.put("totalShops", totalShops);
            
            // Check products
            List<Product> allProducts = productRepository.findAll();
            long approvedProducts = allProducts.stream()
                    .filter(p -> p.getStatus() == ProductStatus.APPROVED)
                    .count();
            
            result.put("totalProducts", allProducts.size());
            result.put("approvedProducts", approvedProducts);
            
            // Check carts
            List<Cart> allCarts = cartRepository.findAll();
            long nonDraftCarts = allCarts.stream()
                    .filter(c -> c.getStatus() != CartStatus.DRAFT)
                    .count();
            
            result.put("totalCarts", allCarts.size());
            result.put("nonDraftCarts", nonDraftCarts);
            
            // Check cart items
            long totalCartItems = cartItemRepository.count();
            result.put("totalCartItems", totalCartItems);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}