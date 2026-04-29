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

    // ─── Existing Endpoints ───────────────────────────────────────────────────

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

    @Operation(summary = "Get Deliveries By User/Driver (FR-DEL2)")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<DeliveryResponseDTO>> getDeliveriesByUser(@PathVariable String userId) {
        return ResponseEntity.ok(deliveryService.getDeliveriesByUser(userId));
    }

    @Operation(summary = "Get Deliveries By Cart (FR-DEL2)")
    @GetMapping("/cart/{cartId}")
    public ResponseEntity<List<DeliveryResponseDTO>> getDeliveriesByCart(@PathVariable String cartId) {
        return ResponseEntity.ok(deliveryService.getDeliveriesByCart(cartId));
    }

    @Operation(summary = "Get Deliveries By Status (FR-DEL2)", description = "Get all deliveries with a specific status (e.g., RETURNED for provider view)")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<DeliveryResponseDTO>> getDeliveriesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(deliveryService.getDeliveriesByStatus(status));
    }

    @Operation(summary = "Update Delivery Details (FR-DEL3)")
    @PutMapping("/{id}")
    public ResponseEntity<DeliveryResponseDTO> updateDelivery(@PathVariable String id,
                                                               @Valid @RequestBody DeliveryRequestDTO request) {
        return ResponseEntity.ok(deliveryService.updateDelivery(id, request));
    }

    @Operation(summary = "Update Delivery Status Only (FR-DEL3)")
    @PatchMapping("/{id}/status")
    public ResponseEntity<DeliveryResponseDTO> updateDeliveryStatus(@PathVariable String id,
                                                                      @RequestParam String status) {
        return ResponseEntity.ok(deliveryService.updateDeliveryStatus(id, status));
    }

    @Operation(summary = "Delete/Cancel Delivery (FR-DEL4)")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDelivery(@PathVariable String id) {
        deliveryService.deleteDelivery(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Driver Workflow Endpoints (FR-DEL5) ──────────────────────────────────

    @Operation(
        summary = "Admin assigns a driver (FR-DEL5)",
        description = "Sets pendingDriverId and sends a notification to the driver with delivery details including cart total."
    )
    @PatchMapping("/{id}/assign")
    public ResponseEntity<DeliveryResponseDTO> assignDriver(
            @PathVariable String id,
            @RequestParam String driverId) {
        return ResponseEntity.ok(deliveryService.assignDriver(id, driverId));
    }

    @Operation(
        summary = "Driver responds to delivery assignment (FR-DEL5)",
        description = "Driver accepts (→ IN_TRANSIT) or declines (→ DRIVER_REFUSED). Admins are notified of the response."
    )
    @PatchMapping("/{id}/respond")
    public ResponseEntity<DeliveryResponseDTO> respondToDelivery(
            @PathVariable String id,
            @RequestParam String driverId,
            @RequestParam boolean accepted,
            @RequestParam(required = false, defaultValue = "") String declineReason) {
        return ResponseEntity.ok(deliveryService.respondToDelivery(id, driverId, accepted, declineReason));
    }

    @Operation(
        summary = "Driver confirms delivery (FR-DEL5)",
        description = "Sets status to DELIVERED and notifies all admins."
    )
    @PatchMapping("/{id}/mark-delivered")
    public ResponseEntity<DeliveryResponseDTO> markAsDelivered(
            @PathVariable String id,
            @RequestParam String driverId) {
        return ResponseEntity.ok(deliveryService.markAsDelivered(id, driverId));
    }

    @Operation(
        summary = "Driver marks delivery as returned (FR-DEL5)",
        description = "Sets status to RETURNED when delivery fails. Package must be returned to shop for provider verification."
    )
    @PatchMapping("/{id}/mark-returned")
    public ResponseEntity<DeliveryResponseDTO> markAsReturned(
            @PathVariable String id,
            @RequestParam String driverId,
            @RequestParam(required = false, defaultValue = "Delivery failed") String reason) {
        return ResponseEntity.ok(deliveryService.markAsReturned(id, driverId, reason));
    }

    @Operation(
        summary = "Get pending deliveries for a driver (FR-DEL5)",
        description = "Returns deliveries where pendingDriverId matches the given driverId."
    )
    @GetMapping("/pending-driver/{driverId}")
    public ResponseEntity<List<DeliveryResponseDTO>> getPendingForDriver(@PathVariable String driverId) {
        return ResponseEntity.ok(deliveryService.getPendingForDriver(driverId));
    }
}
