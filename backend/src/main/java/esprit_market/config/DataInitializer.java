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
    private final ShopRepository shopRepository;
    private final ServiceRepository serviceRepository;
    private final ProductRepository productRepository;
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

        // Initialize Default Discounts (Cart module)
        initializeDiscounts();

        // Initialize Default Services for Negotiation (Marketplace module)
        initializeServices();

        // Initialize Default Products for Negotiation testing
        initializeProducts();
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
                    .ownerId(admin != null ? admin.getId() : null)
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

    private void initializeProducts() {
        Category category = categoryRepository.findAll().stream().findFirst().orElseGet(() -> {
            Category newCat = Category.builder().name("General Products").build();
            return categoryRepository.save(newCat);
        });

        User admin = userRepository.findByEmail("admin@espritmarket.tn").orElse(null);
        Shop shop = shopRepository.findAll().stream().findFirst().orElseGet(() -> {
            Shop newShop = Shop.builder()
                    .ownerId(admin != null ? admin.getId() : null)
                    .build();
            return shopRepository.save(newShop);
        });

        // Define the target products with their specific images
        syncProduct("Wireless Keyboard", 
            "Compact bluetooth keyboard with rechargeable battery", 
            85.0, 20, shop.getId(), category.getId(),
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800");

        syncProduct("Gaming Mouse", 
            "Ergonomic RGB gaming mouse with adjustable DPI", 
            60.0, 30, shop.getId(), category.getId(),
            "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800");

        syncProduct("USB-C Docking Station", 
            "Docking station with HDMI, USB and ethernet ports", 
            190.0, 12, shop.getId(), category.getId(),
            "https://images.unsplash.com/photo-1591405351990-4726e331f141?q=80&w=800");

        syncProduct("iPhone 15 Pro", 
            "2024 Flagship smartphone with 120Hz display and advanced camera", 
            1750.0, 5, shop.getId(), category.getId(),
            "https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=800");

        log.info("Default products synchronized.");
    }

    private void syncProduct(String name, String desc, double price, int stock, org.bson.types.ObjectId shopId, org.bson.types.ObjectId categoryId, String imageUrl) {
        Product existing = productRepository.findAll().stream()
                .filter(p -> p.getName().equalsIgnoreCase(name) || p.getName().replaceAll("\\s+", "").equalsIgnoreCase(name.replaceAll("\\s+", "")))
                .findFirst()
                .orElse(null);

        if (existing == null) {
            Product product = Product.builder()
                    .name(name)
                    .description(desc)
                    .price(price)
                    .stock(stock)
                    .shopId(shopId)
                    .categoryIds(List.of(categoryId))
                    .images(List.of(new esprit_market.entity.marketplace.ProductImage(imageUrl, name)))
                    .status("APPROVED")
                    .build();
            productRepository.save(product);
            log.info("Created product: {}", name);
        } else {
            // Normalize name and ensure photos are set
            boolean modified = false;
            if (!existing.getName().equals(name)) {
                existing.setName(name);
                modified = true;
            }
            if (existing.getImages() == null || existing.getImages().isEmpty()) {
                existing.setImages(List.of(new esprit_market.entity.marketplace.ProductImage(imageUrl, name)));
                modified = true;
            }
            if (!"APPROVED".equals(existing.getStatus())) {
                existing.setStatus("APPROVED");
                modified = true;
            }
            
            if (modified) {
                productRepository.save(existing);
                log.info("Synchronized existing product: {}", name);
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
