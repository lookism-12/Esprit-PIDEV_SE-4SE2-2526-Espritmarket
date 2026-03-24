package esprit_market.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    private static final Logger log = LoggerFactory.getLogger(WebConfig.class);

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Determine upload directory path - use absolute path for consistency
        String uploadsDir;
        String uploadDirConfig = System.getenv("AVATAR_UPLOAD_DIR");
        
        if (uploadDirConfig != null && !uploadDirConfig.isEmpty()) {
            // Use environment variable if set (for Docker/production)
            uploadsDir = uploadDirConfig;
            log.info("Using AVATAR_UPLOAD_DIR from environment: {}", uploadsDir);
        } else {
            // Use project directory + uploads (for development)
            uploadsDir = java.nio.file.Paths.get(System.getProperty("user.dir"))
                    .resolve("uploads")
                    .toAbsolutePath()
                    .toString();
            log.info("Using default uploads directory: {}", uploadsDir);
        }
        
        log.info("Configuring static resources - mapping /uploads/** to {}", uploadsDir);
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadsDir + "/")
                .setCachePeriod(3600); // Cache for 1 hour
    }
}

