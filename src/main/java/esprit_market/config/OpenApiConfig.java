package esprit_market.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

        private static final String SECURITY_SCHEME_NAME = "BearerAuth";

        @Bean
        public OpenAPI espritMarketOpenAPI() {
                return new OpenAPI()
                                .info(new Info()
                                                .title("ESPRIT Market API")
                                                .description("REST API for ESPRIT Market – Spring Boot + MongoDB + JWT")
                                                .version("1.0.0")
                                                .contact(new Contact()
                                                                .name("ESPRIT Market Team")
                                                                .email("contact@espritmarket.tn")))
                                .components(new Components()
                                                .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                                                .name(SECURITY_SCHEME_NAME)
                                                                .type(SecurityScheme.Type.HTTP)
                                                                .scheme("bearer")
                                                                .bearerFormat("JWT")
                                                                .description("Paste your JWT token here (without 'Bearer ' prefix)")))
                                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME));
        }
}
