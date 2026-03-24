package esprit_market.controller.carpoolingController;

import esprit_market.Enum.carpoolingEnum.PaymentStatus;
import esprit_market.dto.carpooling.RidePaymentResponseDTO;
import esprit_market.service.carpoolingService.IRidePaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ride-payments")
@RequiredArgsConstructor
@Tag(name = "Ride Payment Management", description = "APIs for managing carpool ride payments")
public class RidePaymentController {
    private final IRidePaymentService service;

    @GetMapping("/{id}")
    @Operation(summary = "Get payment by ID", description = "Retrieves a payment by its ID")
    public RidePaymentResponseDTO getById(@PathVariable String id) {
        return service.findById(new ObjectId(id));
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Get payment by booking ID", description = "Retrieves a payment associated with a booking")
    public RidePaymentResponseDTO getByBookingId(@PathVariable String bookingId) {
        return service.findByBookingId(new ObjectId(bookingId))
                .orElseThrow(() -> new IllegalArgumentException("Payment not found for booking"));
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get payments by status", description = "Retrieves all payments with optional status filter (Admin only)")
    public List<RidePaymentResponseDTO> getByStatus(@RequestParam(required = false) PaymentStatus status) {
        if (status == null) {
            return service.findAll();
        }
        return service.findByStatus(status);
    }

    @PatchMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update payment status", description = "Manually updates a payment status (Admin only)")
    public RidePaymentResponseDTO updateStatus(@PathVariable String id,
            @RequestParam PaymentStatus status) {
        return service.updateStatus(new ObjectId(id), status);
    }
}
