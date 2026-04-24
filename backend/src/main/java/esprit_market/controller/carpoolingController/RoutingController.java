package esprit_market.controller.carpoolingController;

import esprit_market.dto.carpooling.RoutingRequestDTO;
import esprit_market.dto.carpooling.RoutingResponseDTO;
import esprit_market.service.carpoolingService.RoutingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/route")
@RequiredArgsConstructor
@Tag(name = "Routing", description = "APIs for road routing and distance calculations")
public class RoutingController {

    private final RoutingService routingService;

    @PostMapping
    @Operation(summary = "Calculate road route", description = "Calculates a real road route using OpenRouteService")
    public RoutingResponseDTO getRoute(@RequestBody RoutingRequestDTO request) {
        return routingService.calculateRoute(request);
    }
}
