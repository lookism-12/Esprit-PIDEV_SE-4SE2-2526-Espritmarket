package esprit_market.controller.deliveryEtaController;

import esprit_market.dto.deliveryEta.DeliveryEtaPredictionDTO;
import esprit_market.service.deliveryEtaService.DeliveryEtaPredictionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/delivery-eta")
@RequiredArgsConstructor
@Tag(name = "Delivery ETA AI", description = "AI ETA and weather risk predictions for delivery operations")
public class DeliveryEtaPredictionController {
    private final DeliveryEtaPredictionService etaPredictionService;

    @PostMapping("/{deliveryId}/predict")
    @PreAuthorize("hasAnyRole('ADMIN','DELIVERY')")
    public ResponseEntity<DeliveryEtaPredictionDTO> predict(@PathVariable String deliveryId) {
        return ResponseEntity.ok(etaPredictionService.predictForDelivery(deliveryId));
    }

    @GetMapping("/{deliveryId}/latest")
    @PreAuthorize("hasAnyRole('ADMIN','DELIVERY')")
    public ResponseEntity<DeliveryEtaPredictionDTO> latest(@PathVariable String deliveryId) {
        return etaPredictionService.getLatestForDelivery(deliveryId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{deliveryId}/history")
    @PreAuthorize("hasAnyRole('ADMIN','DELIVERY')")
    public ResponseEntity<List<DeliveryEtaPredictionDTO>> history(@PathVariable String deliveryId) {
        return ResponseEntity.ok(etaPredictionService.getHistoryForDelivery(deliveryId));
    }
}
