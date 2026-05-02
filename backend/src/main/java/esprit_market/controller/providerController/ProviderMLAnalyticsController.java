package esprit_market.controller.providerController;

import esprit_market.dto.cartDto.ProviderMLAnalyticsDTO;
import esprit_market.service.cartService.ProviderMLAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * ML Analytics for providers — GET /api/provider/ml/analytics
 */
@RestController
@RequestMapping("/api/provider/ml")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('PROVIDER')")
@Tag(name = "Provider ML Analytics", description = "AI-powered product analytics for providers")
public class ProviderMLAnalyticsController {

    private final ProviderMLAnalyticsService analyticsService;

    @GetMapping("/analytics")
    @Operation(
        summary = "Get ML analytics for provider's shop",
        description = "Returns AI-powered promotion and price suggestions for all products, with category insights and top recommendations"
    )
    public ResponseEntity<ProviderMLAnalyticsDTO> getAnalytics(Authentication authentication) {
        String email = authentication.getName();
        log.info("🤖 ML Analytics requested by provider: {}", email);

        ProviderMLAnalyticsDTO report = analyticsService.getAnalytics(email);
        return ResponseEntity.ok(report);
    }
}
