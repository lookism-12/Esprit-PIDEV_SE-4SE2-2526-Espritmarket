package esprit_market.config;

import esprit_market.Enum.userEnum.Role;
import esprit_market.entity.marketplace.Category;
import esprit_market.entity.marketplace.Product;
import esprit_market.entity.marketplace.Shop;
import esprit_market.entity.user.User;
import esprit_market.repository.marketplaceRepository.CategoryRepository;
import esprit_market.repository.marketplaceRepository.ProductRepository;
import esprit_market.repository.marketplaceRepository.ShopRepository;
import esprit_market.repository.userRepository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("Initializing data...");

        // 1. Initialize Admin User
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
            log.info("Admin user created.");
        }

        // 2. Initialize Provider User
        String providerEmail = "provider@espritmarket.tn";
        User provider;
        if (!userRepository.existsByEmail(providerEmail)) {
            provider = User.builder()
                    .firstName("Sample")
                    .lastName("Provider")
                    .email(providerEmail)
                    .password(passwordEncoder.encode("password"))
                    .roles(Collections.singletonList(Role.PROVIDER))
                    .enabled(true)
                    .build();
            provider = userRepository.save(provider);
            log.info("Provider user created.");
        } else {
            provider = userRepository.findByEmail(providerEmail).get();
        }

        // 3. Initialize Category
        Category category;
        if (categoryRepository.count() == 0) {
            category = Category.builder()
                    .name("Electronics")
                    .build();
            category = categoryRepository.save(category);
            log.info("Category 'Electronics' created.");
        } else {
            category = categoryRepository.findAll().get(0);
        }

        // 4. Initialize Shop
        Shop shop;
        if (shopRepository.count() == 0) {
            shop = Shop.builder()
                    .ownerId(provider.getId())
                    .build();
            shop = shopRepository.save(shop);
            log.info("Sample shop created for provider.");
        } else {
            shop = shopRepository.findAll().get(0);
        }

        // 5. Initialize Product
        if (productRepository.count() == 0) {
            Product product = Product.builder()
                    .name("iPhone 15 Pro")
                    .description("Apple iPhone 15 Pro with Titanium design")
                    .shopId(shop.getId())
                    .categoryIds(Collections.singletonList(category.getId()))
                    .price(999.99)
                    .stock(10)
                    .build();
            productRepository.save(product);
            log.info("Sample product created.");
        }

        log.info("Data initialization complete.");
    }
}
