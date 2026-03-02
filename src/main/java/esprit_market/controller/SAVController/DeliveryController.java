package esprit_market.controller.SAVController;

import esprit_market.dto.SAV.DeliveryRequestDTO;
import esprit_market.dto.SAV.DeliveryResponseDTO;
import esprit_market.service.SAVService.IDeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
@Tag(name = "Delivery Management", description = "Endpoints for managing deliveries")
public class DeliveryController {

    private final IDeliveryService deliveryService;

    @Operation(summary = "Create Delivery (FR-DEL1)", description = "Creates a delivery assigned to an admin/driver and a cart.")
    @PostMapping
    public ResponseEntity<DeliveryResponseDTO> createDelivery(@Valid @RequestBody DeliveryRequestDTO request) {
        return new ResponseEntity<>(deliveryService.createDelivery(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Get All Deliveries (FR-DEL2)")
    @GetMapping
    public ResponseEntity<List<DeliveryResponseDTO>> getAllDeliveries() {
        return ResponseEntity.ok(deliveryService.getAllDeliveries());
    }

    @Operation(summary = "Get Delivery By ID (FR-DEL2)")
    @GetMapping("/{id}")
    public ResponseEntity<DeliveryResponseDTO> getDeliveryById(@PathVariable String id) {
        return ResponseEntity.ok(deliveryService.getDeliveryById(id));
    }

    @Operation(summary = "Get Deliveries By User/Admin (FR-DEL2)")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DeliveryResponseDTO>> getDeliveriesByUser(@PathVariable String userId) {
        return ResponseEntity.ok(deliveryService.getDeliveriesByUser(userId));
    }

    @Operation(summary = "Get Deliveries By Cart (FR-DEL2)")
    @GetMapping("/cart/{cartId}")
    public ResponseEntity<List<DeliveryResponseDTO>> getDeliveriesByCart(@PathVariable String cartId) {
        return ResponseEntity.ok(deliveryService.getDeliveriesByCart(cartId));
    }

    @Operation(summary = "Update Delivery Details (FR-DEL3)")
    @PutMapping("/{id}")
    public ResponseEntity<DeliveryResponseDTO> updateDelivery(
            @PathVariable String id,
            @Valid @RequestBody DeliveryRequestDTO request) {
        return ResponseEntity.ok(deliveryService.updateDelivery(id, request));
    }

    @Operation(summary = "Update Delivery Status Only (FR-DEL3)")
    @PatchMapping("/{id}/status")
    public ResponseEntity<DeliveryResponseDTO> updateDeliveryStatus(
            @PathVariable String id,
            @RequestParam String status) {
        return ResponseEntity.ok(deliveryService.updateDeliveryStatus(id, status));
    }

    @Operation(summary = "Delete/Cancel Delivery (FR-DEL4)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(@PathVariable String id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }
}
