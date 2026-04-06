package esprit_market.config;

import esprit_market.Enum.cartEnum.DiscountType;
import esprit_market.Enum.userEnum.Role;
import esprit_market.entity.cart.Discount;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.cartRepository.DiscountRepository;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ServiceRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DiscountRepository discountRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final ServiceRepository serviceRepository;
    private final MongoTemplate mongoTemplate;

    @Override
    public void run(String... args) {
        log.info("Initializing data...");

        // Fix legacy roles in the database
        migrateLegacyRoles();

        // Initialize Admin User
        String adminEmail = "admin@espritmarket.tn";
        String adminPassword = "admin123";

        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .firstName("Admin")
                    .lastName("Esprit")
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .roles(Collections.singletonList(Role.ADMIN))
                    .enabled(true)
                    .build();

            userRepository.save(admin);
            log.info("Admin user created with email: {}", adminEmail);
        } else {
            // Force reset password to 'admin123' if it doesn't match
            userRepository.findByEmail(adminEmail).ifPresent(admin -> {
                String stored = admin.getPassword();
                boolean matches = stored != null && passwordEncoder.matches(adminPassword, stored);
                if (!matches) {
                    log.warn("Admin password hash doesn't match 'admin123'. Forcing reset...");
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                    userRepository.save(admin);
                    log.info("Admin password has been reset to 'admin123'.");
                } else {
                    log.info("Admin user already has the correct password ('admin123').");
                }
            });
        }

        // ✅ Initialize Test CLIENT User for Cart Testing
        String clientEmail = "client@test.com";
        String clientPassword = "test123";
        
        if (!userRepository.existsByEmail(clientEmail)) {
            User testClient = User.builder()
                    .firstName("Test")
                    .lastName("Client") 
                    .email(clientEmail)
                    .password(passwordEncoder.encode(clientPassword))
                    .roles(Collections.singletonList(Role.CLIENT))
                    .enabled(true)
                    .build();

            User savedClient = userRepository.save(testClient);
            log.info("✅ Test CLIENT user created: {} with ID: {}", clientEmail, savedClient.getId());
            log.warn("🔧 TEMP FIX: Update CartController getUserId() with this actual ID: {}", savedClient.getId());
        } else {
            User existingClient = userRepository.findByEmail(clientEmail).orElse(null);
            if (existingClient != null) {
                log.info("✅ Test CLIENT user exists: {} with ID: {}", clientEmail, existingClient.getId());
                log.warn("🔧 TEMP FIX: Use this ID in CartController: {}", existingClient.getId());
            }
        }

        // ✅ Initialize Test PROVIDER User for Provider Dashboard Testing
        String providerEmail = "provider@test.com";
        String providerPassword = "test123";
        
        if (!userRepository.existsByEmail(providerEmail)) {
            User testProvider = User.builder()
                    .firstName("Test")
                    .lastName("Provider")
                    .email(providerEmail)
                    .password(passwordEncoder.encode(providerPassword))
                    .roles(Collections.singletonList(Role.PROVIDER))
                    .enabled(true)
                    .businessName("Test Shop")
                    .businessType("Electronics")
                    .build();

            User savedProvider = userRepository.save(testProvider);
            log.info("✅ Test PROVIDER user created: {} with ID: {}", providerEmail, savedProvider.getId());
        } else {
            User existingProvider = userRepository.findByEmail(providerEmail).orElse(null);
            if (existingProvider != null) {
                log.info("✅ Test PROVIDER user exists: {} with ID: {}", providerEmail, existingProvider.getId());
            }
        }

        // Initialize Default Discounts (Cart module)
        initializeDiscounts();

        // Initialize Default Services for Negotiation (Marketplace module)
        initializeServices();
        
        // Initialize Demo Products for Cart Testing
        initializeDemoProducts();
    }

    private void initializeDiscounts() {
        if (discountRepository.count() == 0) {
            Discount discount20 = Discount.builder()
                    .name("Spring Sale 20%")
                    .description("20% discount on all products")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(20.0)
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.of(2026, 3, 31))
                    .active(true)
                    .minCartAmount(50.0)
                    .autoActivate(true)
                    .build();

            Discount flashSale = Discount.builder()
                    .name("Flash Sale 50%")
                    .description("Flash sale - 50% off limited time")
                    .discountType(DiscountType.PERCENTAGE)
                    .discountValue(50.0)
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.of(2026, 2, 28))
                    .active(true)
                    .minCartAmount(100.0)
                    .autoActivate(false)
                    .build();

            discountRepository.save(discount20);
            discountRepository.save(flashSale);

            log.info("Default discounts created.");
            log.info("Discount ID 'Spring Sale 20%': {}", discount20.getId());
            log.info("Discount ID 'Flash Sale 50%': {}", flashSale.getId());
        } else {
            log.info("Discounts already initialized. Listing IDs for testing:");
            discountRepository.findAll().forEach(d -> log.info("Discount ID '{}': {}", d.getName(), d.getId()));
        }
    }

    private void initializeServices() {
        // We need a category and a shop to create a service
        Category category = categoryRepository.findAll().stream().findFirst().orElseGet(() -> {
            Category newCat = Category.builder().name("General Services").build();
            return categoryRepository.save(newCat);
        });

        User admin = userRepository.findByEmail("admin@espritmarket.tn").orElse(null);
        Shop shop = shopRepository.findAll().stream().findFirst().orElseGet(() -> {
            Shop newShop = Shop.builder()
                    .name("Admin Shop")
                    .description("Default shop for services")
                    .logo("https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400")
                    .address("Esprit Campus, Tunis")
                    .phone("+216 71 000 000")
                    .ownerId(admin != null ? admin.getId() : null)
                    .productIds(new java.util.ArrayList<>())
                    .build();
            return shopRepository.save(newShop);
        });

        if (serviceRepository.count() < 3) {
            ServiceEntity service1 = ServiceEntity.builder()
                    .name("Logo Design Service")
                    .description("Professional logo design for your business")
                    .price(150.0)
                    .shopId(shop.getId())
                    .categoryId(category.getId())
                    .build();

            ServiceEntity service2 = ServiceEntity.builder()
                    .name("Web Development")
                    .description("Full stack web development services")
                    .price(1200.0)
                    .shopId(shop.getId())
                    .categoryId(category.getId())
                    .build();

            ServiceEntity service3 = ServiceEntity.builder()
                    .name("Mobile App Development")
                    .description("Custom iOS and Android apps")
                    .price(2500.0)
                    .shopId(shop.getId())
                    .categoryId(category.getId())
                    .build();

            serviceRepository.save(service1);
            serviceRepository.save(service2);
            serviceRepository.save(service3);

            log.info("Default services created.");
        }

        log.info("Services available for negotiation testing:");
        serviceRepository.findAll()
                .forEach(s -> log.info("Service ID '{}' ({}): {}", s.getName(), s.getPrice(), s.getId()));
    }

    private void initializeDemoProducts() {
        if (productRepository.count() < 3) {
            
            // Get or create category
            Category category = categoryRepository.findAll().stream().findFirst().orElseGet(() -> {
                Category newCat = Category.builder().name("Electronics").build();
                return categoryRepository.save(newCat);
            });
            
            // ✅ Get provider's shop (not admin's)
            User provider = userRepository.findByEmail("provider@test.com").orElse(null);
            Shop shop = null;
            
            if (provider != null) {
                shop = shopRepository.findByOwnerId(provider.getId()).orElseGet(() -> {
                    Shop newShop = Shop.builder()
                            .name(provider.getBusinessName() != null ? 
                                  provider.getBusinessName() : 
                                  provider.getFirstName() + "'s Shop")
                            .description("Official shop of " + provider.getFirstName())
                            .logo("https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400")
                            .address(provider.getAddress() != null ? provider.getAddress() : "Esprit Campus, Tunis")
                            .phone(provider.getPhone() != null ? provider.getPhone() : "+216 12 345 678")
                            .ownerId(provider.getId())
                            .productIds(new java.util.ArrayList<>())
                            .build();
                    Shop savedShop = shopRepository.save(newShop);
                    log.info("✅ Created shop '{}' for provider: {} (ID: {})", savedShop.getName(), provider.getEmail(), savedShop.getId());
                    return savedShop;
                });
                log.info("✅ Using provider's shop: {} for demo products", shop.getId());
            } else {
                // Fallback to admin's shop if provider doesn't exist
                User admin = userRepository.findByEmail("admin@espritmarket.tn").orElse(null);
                shop = shopRepository.findAll().stream().findFirst().orElseGet(() -> {
                    Shop newShop = Shop.builder()
                            .name("Default Shop")
                            .description("Fallback shop for products")
                            .logo("https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400")
                            .address("Esprit Campus, Tunis")
                            .phone("+216 71 000 000")
                            .ownerId(admin != null ? admin.getId() : null)
                            .productIds(new java.util.ArrayList<>())
                            .build();
                    return shopRepository.save(newShop);
                });
            }

            // Create demo products with proper stock for cart testing
            Product product1 = Product.builder()
                    .name("iPhone 15 Pro")
                    .description("Latest iPhone with advanced features")
                    .price(1299.99)
                    .stock(50)  // Sufficient stock for testing
                    .shopId(shop.getId())
                    .categoryIds(Collections.singletonList(category.getId()))
                    .build();

            Product product2 = Product.builder()
                    .name("MacBook Air M3")
                    .description("Ultra-thin laptop with M3 chip")
                    .price(1499.99)
                    .stock(25)
                    .shopId(shop.getId())
                    .categoryIds(Collections.singletonList(category.getId()))
                    .build();

            Product product3 = Product.builder()
                    .name("AirPods Pro")
                    .description("Wireless earbuds with noise cancellation")
                    .price(249.99)
                    .stock(100)
                    .shopId(shop.getId())
                    .categoryIds(Collections.singletonList(category.getId()))
                    .build();

            Product saved1 = productRepository.save(product1);
            Product saved2 = productRepository.save(product2);
            Product saved3 = productRepository.save(product3);

            // ✅ CRITICAL: Approve demo products so they're visible on marketplace
            User admin = userRepository.findByEmail("admin@espritmarket.tn").orElse(null);
            ObjectId adminId = admin != null ? admin.getId() : null;
            
            saved1.setStatus(esprit_market.Enum.marketplaceEnum.ProductStatus.APPROVED);
            saved1.setApprovedAt(java.time.LocalDateTime.now());
            saved1.setApprovedBy(adminId);
            saved1 = productRepository.save(saved1);
            
            saved2.setStatus(esprit_market.Enum.marketplaceEnum.ProductStatus.APPROVED);
            saved2.setApprovedAt(java.time.LocalDateTime.now());
            saved2.setApprovedBy(adminId);
            saved2 = productRepository.save(saved2);
            
            saved3.setStatus(esprit_market.Enum.marketplaceEnum.ProductStatus.APPROVED);
            saved3.setApprovedAt(java.time.LocalDateTime.now());
            saved3.setApprovedBy(adminId);
            saved3 = productRepository.save(saved3);

            log.info("✅ Demo products created and APPROVED for cart testing:");
            log.info("Product ID '{}' ({}): {} - Stock: {} - Status: {}", saved1.getName(), saved1.getPrice(), saved1.getId(), saved1.getStock(), saved1.getStatus());
            log.info("Product ID '{}' ({}): {} - Stock: {} - Status: {}", saved2.getName(), saved2.getPrice(), saved2.getId(), saved2.getStock(), saved2.getStatus());
            log.info("Product ID '{}' ({}): {} - Stock: {} - Status: {}", saved3.getName(), saved3.getPrice(), saved3.getId(), saved3.getStock(), saved3.getStatus());
            
            // ✅ CRITICAL: Log the EXACT product ID that frontend should use
            log.warn("🔧 FRONTEND FIX: Use this Product ID in your cart tests: {}", saved1.getId());
            log.warn("🔧 CURL TEST: curl -X POST http://localhost:8090/api/cart/items -H \"Content-Type: application/json\" -d '{{\"productId\":\"{}\",\"quantity\":3}}'", saved1.getId());

        } else {
            log.info("Demo products already exist. Listing for cart testing:");
            productRepository.findAll().forEach(p -> 
                log.info("Product ID '{}' ({}): {} - Stock: {}", p.getName(), p.getPrice(), p.getId(), p.getStock())
            );
            
            // Log first product for easy testing
            Product firstProduct = productRepository.findAll().stream().findFirst().orElse(null);
            if (firstProduct != null) {
                log.warn("🔧 FRONTEND FIX: Use this Product ID: {}", firstProduct.getId());
                log.warn("🔧 CURL TEST: curl -X POST http://localhost:8090/api/cart/items -H \"Content-Type: application/json\" -d '{{\"productId\":\"{}\",\"quantity\":3}}'", firstProduct.getId());
            }
        }
    }

    private void migrateLegacyRoles() {
        log.info("Checking for legacy role formats...");
        try {
            var usersCollection = mongoTemplate.getCollection("users");

            // Migration logic: handle both admin and other users
            usersCollection.find().forEach(doc -> {
                String email = doc.getString("email");
                Object rolesObj = doc.get("roles");

                if (rolesObj instanceof List) {
                    List<?> rolesList = (List<?>) rolesObj;
                    if (!rolesList.isEmpty()) {
                        Object firstRole = rolesList.get(0);

                        // If it's not a String, it's a legacy object (Document or Map)
                        if (!(firstRole instanceof String)) {
                            log.info("FIX: Detected legacy roles for user {}. Format: {}", email,
                                    firstRole.getClass().getSimpleName());

                            // For ALL users discovered with broken roles, we try to fix or reset
                            List<String> newRoles = rolesList.stream()
                                    .map(r -> {
                                        if (r instanceof org.bson.Document) {
                                            String name = ((org.bson.Document) r).getString("name");
                                            return name != null ? name.replace("ROLE_", "") : "CLIENT";
                                        }
                                        return "CLIENT";
                                    })
                                    .collect(Collectors.toList());

                            if (newRoles.isEmpty())
                                newRoles = Collections.singletonList("CLIENT");

                            // Force save as primitive strings
                            usersCollection.updateOne(
                                    new org.bson.Document("_id", doc.get("_id")),
                                    new org.bson.Document("$set", new org.bson.Document("roles", newRoles)));

                            log.info("FIX: Successfully migrated user {} to roles: {}", email, newRoles);

                            // Extra precaution for admin: if roles were broken, delete to be safe
                            if ("admin@espritmarket.tn".equals(email)) {
                                log.warn("Admin account roles were corrupted. Deleting for full recreation.");
                                usersCollection.deleteOne(new org.bson.Document("_id", doc.get("_id")));
                            }
                        }
                    }
                }
            });
        } catch (Exception e) {
            log.error("Migration failed: {}", e.getMessage());
        }
    }
}
