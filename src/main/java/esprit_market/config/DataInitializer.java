package esprit_market.config;

import esprit_market.Enum.userEnum.Role;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Event;
import esprit_market.entity.marketplace.Promotion;
import esprit_market.entity.marketplace.ServiceEntity;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.EventRepository;
import esprit_market.repository.marketplaceRepository.PromotionRepository;
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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EventRepository eventRepository;
    private final PromotionRepository promotionRepository;
    private final CategoryRepository categoryRepository;
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
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .firstName("Admin")
                    .lastName("Esprit")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("admin"))
                    .roles(Collections.singletonList(Role.ADMIN))
                    .enabled(true)
                    .build();

            userRepository.save(admin);
            log.info("Admin user created with email: {}", adminEmail);
        } else {
            log.info("Admin user already exists.");
        }

        // Initialize Default Events
        initializeEvents();

        // Initialize Default Promotions
        initializePromotions();

        // Initialize Default Services for Negotiation
        initializeServices();
    }

    private void initializeEvents() {
        if (eventRepository.count() == 0) {
            Event blackFriday = Event.builder()
                    .name("Black Friday 2026")
                    .description("Grande promotion annuelle")
                    .date(LocalDateTime.of(2026, 11, 27, 0, 0))
                    .build();
            Event techConference = Event.builder()
                    .name("Tech Conference")
                    .description("Conférence sur les nouvelles technologies")
                    .date(LocalDateTime.of(2026, 5, 15, 9, 0))
                    .build();

            eventRepository.save(blackFriday);
            eventRepository.save(techConference);

            log.info("Default events created.");
            log.info("Event ID 'Black Friday': {}", blackFriday.getId());
            log.info("Event ID 'Tech Conference': {}", techConference.getId());
        } else {
            log.info("Events already initialized. Listing IDs for testing:");
            eventRepository.findAll().forEach(e -> log.info("Event ID '{}': {}", e.getName(), e.getId()));
        }
    }

    private void initializePromotions() {
        if (promotionRepository.count() == 0) {
            Promotion discount20 = Promotion.builder()
                    .title("Discount 20%")
                    .discountPercentage(20.0)
                    .validUntil(LocalDateTime.of(2026, 3, 31, 23, 59))
                    .build();
            Promotion flashSale = Promotion.builder()
                    .title("Flash Sale")
                    .discountPercentage(50.0)
                    .validUntil(LocalDateTime.of(2026, 2, 28, 23, 59))
                    .build();

            promotionRepository.save(discount20);
            promotionRepository.save(flashSale);

            log.info("Default promotions created.");
            log.info("Promotion ID 'Discount 20%': {}", discount20.getId());
            log.info("Promotion ID 'Flash Sale': {}", flashSale.getId());
        } else {
            log.info("Promotions already initialized. Listing IDs for testing:");
            promotionRepository.findAll().forEach(p -> log.info("Promotion ID '{}': {}", p.getTitle(), p.getId()));
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
