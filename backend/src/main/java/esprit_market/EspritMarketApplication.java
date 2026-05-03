package esprit_market;

import esprit_market.config.TwilioProperties;
import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

import esprit_market.config.TwilioProperties;

@SpringBootApplication
@EnableScheduling
@EnableAsync
@EnableConfigurationProperties(TwilioProperties.class)
public class    EspritMarketApplication {

    public static void main(String[] args) {
        loadLocalDotenv();
        SpringApplication.run(EspritMarketApplication.class, args);
    }

    private static void loadLocalDotenv() {
        if (isProductionProfile()) {
            return;
        }

        Path dotenvDirectory = null;
        if (Files.exists(Path.of(".env"))) {
            dotenvDirectory = Path.of(".");
        } else if (Files.exists(Path.of("backend", ".env"))) {
            dotenvDirectory = Path.of("backend");
        }

        if (dotenvDirectory == null) {
            return;
        }

        Dotenv dotenv = Dotenv.configure()
                .directory(dotenvDirectory.toString())
                .ignoreIfMissing()
                .ignoreIfMalformed()
                .load();

        dotenv.entries().forEach(entry -> {
            String key = entry.getKey();
            if (System.getenv(key) == null && System.getProperty(key) == null) {
                System.setProperty(key, entry.getValue());
            }
        });
    }

    private static boolean isProductionProfile() {
        String profile = System.getProperty("SPRING_PROFILES_ACTIVE");
        if (profile == null || profile.isBlank()) {
            profile = System.getenv("SPRING_PROFILES_ACTIVE");
        }
        return profile != null && profile.toLowerCase(Locale.ROOT).contains("production");
    }
}
